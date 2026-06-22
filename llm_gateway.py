"""
AETHER LLM Gateway — Multi-Provider AI Gateway
================================================
Provides a single `call_llm(system_prompt, user_prompt)` function that
routes to multiple LLM providers with automatic failover.

Supports: Gemini, NVIDIA, Groq, Cerebras, OpenRouter, GitHub Models
Uses only Python stdlib (urllib, json, os) — zero pip installs.
"""

import os
import json
import urllib.request
import urllib.error
import ssl
import time
import traceback

# ── Load .env ─────────────────────────────────────────────────

def _load_env(env_path=None):
    """Parse a .env file into os.environ."""
    if env_path is None:
        env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if not os.path.exists(env_path):
        print('[LLM Gateway] WARNING: .env file not found at', env_path)
        return
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, val = line.split('=', 1)
                os.environ[key.strip()] = val.strip()
    print('[LLM Gateway] Loaded .env from', env_path)

_load_env()

# ── SSL Context (permissive for corporate proxies) ────────────

_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE

# ── Provider Configurations ───────────────────────────────────

PROVIDERS = {
    'gemini': {
        'name': 'Google Gemini',
        'api_key_env': 'GEMINI_API_KEY',
        'model_env': 'GEMINI_MODEL',
        'default_model': 'gemini-2.5-flash',
        'url_template': 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}',
        'format': 'gemini'
    },
    'nvidia': {
        'name': 'NVIDIA NIM',
        'api_key_env': 'NVIDIA_API_KEY',
        'model_env': 'NVIDIA_MODEL',
        'default_model': 'meta/llama-3.1-70b-instruct',
        'url_template': 'https://integrate.api.nvidia.com/v1/chat/completions',
        'format': 'openai'
    },
    'groq': {
        'name': 'Groq',
        'api_key_env': 'GROQ_API_KEY',
        'model_env': 'GROQ_MODEL',
        'default_model': 'llama-3.1-70b-versatile',
        'url_template': 'https://api.groq.com/openai/v1/chat/completions',
        'format': 'openai'
    },
    'cerebras': {
        'name': 'Cerebras',
        'api_key_env': 'CEREBRAS_API_KEY',
        'model_env': 'CEREBRAS_MODEL',
        'default_model': 'llama3.1-70b',
        'url_template': 'https://api.cerebras.ai/v1/chat/completions',
        'format': 'openai'
    },
    'openrouter': {
        'name': 'OpenRouter',
        'api_key_env': 'OPEN_ROUTER_API_KEY',
        'model_env': 'OPENROUTER_MODEL',
        'default_model': 'openai/gpt-4-turbo',
        'url_template': 'https://openrouter.ai/api/v1/chat/completions',
        'format': 'openai'
    },
    'github': {
        'name': 'GitHub Models',
        'api_key_env': 'GITHUB_ACCESS_TOKEN',
        'model_env': 'GITHUB_MODEL',
        'default_model': 'gpt-4o',
        'url_template': 'https://models.inference.ai.azure.com/chat/completions',
        'format': 'openai'
    }
}

# ── Determine provider order ──────────────────────────────────

def _get_provider_order():
    order_str = os.environ.get('LLM_ORDER', 'gemini,nvidia,groq,cerebras,openrouter,github')
    return [p.strip().lower() for p in order_str.split(',') if p.strip().lower() in PROVIDERS]

# ── Call a specific provider ──────────────────────────────────

def _call_gemini(api_key, model, system_prompt, user_prompt, temperature=0.3):
    """Call Google Gemini API."""
    url = PROVIDERS['gemini']['url_template'].format(model=model, api_key=api_key)
    
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": system_prompt + "\n\n" + user_prompt}]
            }
        ],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": 4096,
            "responseMimeType": "application/json"
        }
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    
    with urllib.request.urlopen(req, context=_ssl_ctx, timeout=60) as resp:
        result = json.loads(resp.read().decode('utf-8'))
    
    # Extract text from Gemini response
    text = result['candidates'][0]['content']['parts'][0]['text']
    return text


def _call_openai_compatible(provider_key, api_key, model, system_prompt, user_prompt, temperature=0.3):
    """Call any OpenAI-compatible API (NVIDIA, Groq, Cerebras, OpenRouter, GitHub)."""
    cfg = PROVIDERS[provider_key]
    url = cfg['url_template']
    
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": temperature,
        "max_tokens": 4096,
        "response_format": {"type": "json_object"}
    }
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + api_key
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers)
    
    with urllib.request.urlopen(req, context=_ssl_ctx, timeout=60) as resp:
        result = json.loads(resp.read().decode('utf-8'))
    
    # Extract text from OpenAI-format response
    text = result['choices'][0]['message']['content']
    return text

# ── Main entry point ──────────────────────────────────────────

def call_llm(system_prompt, user_prompt, temperature=0.3):
    """
    Call an LLM with automatic failover across providers.
    
    Args:
        system_prompt: System/context prompt
        user_prompt: User prompt with the actual request
        temperature: Generation temperature (default 0.3 for structured output)
    
    Returns:
        dict with keys: success (bool), text (str), provider (str), model (str), error (str|None)
    """
    order = _get_provider_order()
    
    if not order:
        return {'success': False, 'text': '', 'provider': None, 'model': None, 'error': 'No providers configured in LLM_ORDER'}
    
    errors = []
    
    for provider_key in order:
        cfg = PROVIDERS[provider_key]
        api_key = os.environ.get(cfg['api_key_env'], '')
        model = os.environ.get(cfg['model_env'], cfg['default_model'])
        
        if not api_key:
            errors.append(provider_key + ': No API key')
            continue
        
        try:
            start = time.time()
            
            if cfg['format'] == 'gemini':
                text = _call_gemini(api_key, model, system_prompt, user_prompt, temperature)
            else:
                text = _call_openai_compatible(provider_key, api_key, model, system_prompt, user_prompt, temperature)
            
            elapsed = round(time.time() - start, 2)
            print('[LLM Gateway] ' + cfg['name'] + ' (' + model + ') responded in ' + str(elapsed) + 's')
            
            return {
                'success': True,
                'text': text,
                'provider': cfg['name'],
                'model': model,
                'elapsed': elapsed,
                'error': None
            }
        
        except urllib.error.HTTPError as e:
            err_body = ''
            try:
                err_body = e.read().decode('utf-8')[:200]
            except:
                pass
            err_msg = provider_key + ': HTTP ' + str(e.code) + ' — ' + err_body
            errors.append(err_msg)
            print('[LLM Gateway] FAIL ' + err_msg)
        
        except Exception as e:
            err_msg = provider_key + ': ' + str(e)
            errors.append(err_msg)
            print('[LLM Gateway] FAIL ' + err_msg)
    
    return {
        'success': False,
        'text': '',
        'provider': None,
        'model': None,
        'error': 'All providers failed: ' + '; '.join(errors)
    }


def parse_json_response(text):
    """
    Parse JSON from LLM response, handling markdown code fences.
    """
    cleaned = text.strip()
    # Remove markdown code fences
    if cleaned.startswith('```'):
        lines = cleaned.split('\n')
        # Remove first line (```json) and last line (```)
        lines = [l for l in lines if not l.strip().startswith('```')]
        cleaned = '\n'.join(lines)
    
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to find JSON object in the text
        start = cleaned.find('{')
        end = cleaned.rfind('}')
        if start != -1 and end != -1:
            try:
                return json.loads(cleaned[start:end+1])
            except:
                pass
        # Try array
        start = cleaned.find('[')
        end = cleaned.rfind(']')
        if start != -1 and end != -1:
            try:
                return json.loads(cleaned[start:end+1])
            except:
                pass
        return None


# ── Quick self-test ───────────────────────────────────────────

if __name__ == '__main__':
    print('Testing LLM Gateway...')
    print('Provider order:', _get_provider_order())
    result = call_llm(
        'You are a test assistant. Respond in JSON format.',
        'Return a JSON object with a single key "status" set to "ok" and "message" set to "AETHER LLM Gateway is operational".'
    )
    print('Result:', json.dumps(result, indent=2))
    if result['success']:
        parsed = parse_json_response(result['text'])
        print('Parsed:', parsed)
