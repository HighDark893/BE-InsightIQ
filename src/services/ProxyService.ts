import axios from 'axios';
import { env } from '../config/app.config';
import { Logger } from '../utils/Logger';

export class ProxyService {

    private readonly logger = Logger.getInstance();

    constructor() {

    }

    public async proxyRequest(body: any): Promise<any> {
        const { method } = body;

       return body;
    }
}
