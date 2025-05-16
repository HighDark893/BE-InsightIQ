import { Logger } from '../utils/Logger';

export class ProxyService {

    private readonly logger = Logger.getInstance();

    constructor() {

    }

    public async proxyRequest(body: any): Promise<any> {

        const proxy = body;

       return body;
    }
}
