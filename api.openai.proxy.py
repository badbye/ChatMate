def request(context, flow):
    if 'api.openai.com' == flow.request.host:
        if flow.request.scheme == 'https':
            flow.request.scheme = 'http'
            flow.request.host = 'localhost'
            flow.request.prot = 80
