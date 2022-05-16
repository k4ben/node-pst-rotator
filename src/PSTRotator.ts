import { get } from 'http';
// import { parse } from 'node-html-parser';

const textBetween = (text: string, l: string, r: string) => {
  return text.split(l)[1].split(r)[0];
}

class PSTRotator {

  origin: string
  private _bearing: number | undefined = undefined
  pollRate: number

  onBearing: (bearing: number) => void = ()=>{}

  constructor(origin: string, pollRate=1000) {
    this.pollRate = pollRate;
    this.origin = origin;
  }

  get bearing() {
    return this._bearing;
  }

  async poll() {
    const bearing = await this.getBearing();
    if (bearing != this._bearing) {
      this._bearing = bearing;
      this.onBearing(bearing);
    }
    setTimeout(()=> this.poll(), this.pollRate);
  }

  async getBearing() {
    const html = await this.get();
    return parseInt(textBetween(html, "Bearing = ", "deg"));
  }

  async setBearing(bearing: number) {
    if (bearing < 0 || bearing > 359) {
      throw new Error(`Invalid bearing: ${bearing}`);
    }
    await this.get(`PstRotatorAz.htm?az=${bearing}`);
  }

  async stopRotating() {
    await this.get(`PstRotatorAz.htm?cmd=stop`);
  }

  get(pathname=""): Promise<string> {
    return new Promise((resolve, reject)=> {
      get(this.origin+pathname, res => {
        if (res.statusCode !== 200) {
          reject(new Error(`Did not get an OK from the server. Code: ${res.statusCode}`));
        }
        let data = '';
  
        res.on('data', (chunk) => {
          data += chunk;
        });
  
        res.on('close', () => {
          resolve(data);
        });
      });
    });
  }
}

export default PSTRotator;