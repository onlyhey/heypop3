import * as net from 'net'
import * as iconv from 'iconv-lite'
type ActionType =
    | 'CONNECT'
    | 'USER'
    | 'PASS'
    | 'APOP'
    | 'STAT'
    | 'UIDL'
    | 'LIST'
    | 'RETR'
    | 'DELE'
    | 'RSET'
    | 'TOP'
    | 'NOOP'
    | 'QUIT'

interface POP3Opts {
    host: string
    port: number
}
export default class POP3Client {
    private client: net.Socket
    private opts: net.SocketConnectOpts
    private timeout: number
    constructor(opts: net.SocketConnectOpts, timeout?: number) {
        this.opts = opts
        this.timeout = timeout || 10000
        this.client = new net.Socket()
    }
    private waitFor(action: ActionType, param?: string | number | string[]) {
        return new Promise((resolve: (args: string) => void, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('timeout waiting for response'))
                this.client.removeListener('data', onData)
            }, this.timeout)
            this.client.once('data', onData)
            function onData(data: Buffer) {
                clearTimeout(timer)
                const dataString = iconv.decode(data, 'gbk')
                console.log(dataString)
                if (dataString.substr(0, 3) === '+OK') {
                    resolve(dataString.substr(4))
                } else {
                    reject(dataString.substr(5))
                    return
                }
            }
            switch (action) {
                case 'CONNECT':
                    this.client.connect(this.opts)
                    break
                case 'USER':
                    this.client.write('USER ' + param + '\r\n')
                    break
                case 'PASS':
                    this.client.write('PASS ' + param + '\r\n')
                    break
                case 'STAT':
                    this.client.write('STAT\r\n')
                    break
                case 'LIST':
                    this.client.write('LIST\r\n')
                    break
                case 'RETR':
                    this.client.write('RETR ' + param + '\r\n')
                    break
                default:
                    break
            }
        })
    }

    /**
     * connect
     */
    public async connect() {
        return await this.waitFor('CONNECT')
    }
    public async login(email: string, password: string) {
        await this.waitFor('USER', email)
        return await this.waitFor('PASS', password)
    }
    public async status() {
        return await this.waitFor('STAT')
    }
    public async list() {
        return await this.waitFor('LIST')
    }
}
