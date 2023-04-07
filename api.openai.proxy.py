from mitmproxy import http, tcp

redirect_url = 'http://127.0.0.1:80'

def http_connect(flow: http.HTTPFlow) -> None:
    target_url = flow.request.pretty_url
    print('http_connect target_url: ', type(target_url), target_url)
#     if target_url == 'api.openai.com:443':
#         print(f'Redirecting: {target_url} to {redirect_url}')
#         # flow.request.url = redirect_url
#         flow.request.port = 80
#         flow.request.scheme = 'http'
#         flow.request.host = '127.0.0.1'
#         flow.request.url = redirect_url


def requestheaders(flow: http.HTTPFlow) -> None:
    target_url = flow.request.url
    print('requestheaders target_url: ', type(target_url), target_url)



def request(flow: http.HTTPFlow) -> None:
    target_url = flow.request.url
    print('request target_url: ', type(target_url), target_url)

# def tcp_start(flow: tcp.TCPFlow):
#     target_url = flow.server_conn.address
#     print('tcp_start target_url: ', type(target_url), target_url)
