import { EventEmitter } from 'events';

// Create a mock Redis client to prevent infinite ECONNREFUSED throttling
class MockRedis extends EventEmitter {
    status = 'ready';
    
    call(...args: any[]) { return Promise.resolve(null); }
    get(...args: any[]) { return Promise.resolve(null); }
    set(...args: any[]) { return Promise.resolve('OK'); }
    del(...args: any[]) { return Promise.resolve(1); }
    quit() { return Promise.resolve('OK'); }
    eval() { return Promise.resolve(null); }
    
    // BullMQ requires these deeply
    on(event: string, listener: (...args: any[]) => void): this {
       return super.on(event, listener);
    }
}

const redisClient = new MockRedis() as any;

export default redisClient;
