from mitmproxy import http

def request(flow: http.HTTPFlow) -> None:
    target_url = flow.request.url

    if target_url.startswith('https://api.openai.com/v1/chat/completions'):
        redirect_url = 'http://localhost:80/v1/chat/completions'
        print(f'Redirecting: {target_url} to {redirect_url}')
        flow.request.url = redirect_url
