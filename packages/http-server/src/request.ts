import { IncomingMessage } from "http";
import { ParsedPath, posix } from "path";
import accepts, { Accepts } from "accepts";
import base64url from "base64url";
import { parse as parseCookie } from "cookie";
import { v4 } from "uuid";
import type { Response } from "./response";

export type Cookie = {
  [key: string]: any;
};

export type Session = {
  [key: string]: string;
};

export type SessionStore = {
  (key: string): Promise<string>;
  (key: string, value: string): Promise<void>;
};

const { parse: parsePath } = posix;

export const sid = () => base64url.fromBase64(v4(null, Buffer.alloc(16)).toString("base64"));

export class Request extends IncomingMessage {
  response!: Response;
  port!: string;
  _host!: string | null;
  _origin!: string | null;
  _path!: string | null;
  _href!: string | null;
  __url!: URL | null;
  _parsedPath!: ParsedPath | null;
  _accepts!: Accepts | null;
  _type!: { [type: string]: string | false } | null;
  _types!: string[] | null;
  _encoding!: { [encoding: string]: string | false } | null;
  _encodings!: string[] | null;
  _charset!: { [charset: string]: string | false } | null;
  _charsets!: string[] | null;
  _language!: { [language: string]: string | false } | null;
  _languages!: string[] | null;
  _cookie!: Cookie | null;
  _sessionStore!: Session;
  ___session!: string;
  _session!: Promise<Session> | null;
  get protocol() {
    return this.headers["x-forwarded-proto"] === "https" ? "https:" : "http:";
  }
  get hostname() {
    return this.headers.host ?? "localhost";
  }
  get host() {
    return (this._host ||= this.port === "" ? this.hostname : `${this.hostname}:${this.port}`);
  }
  get origin() {
    return (this._origin ||= `${this.protocol}//${this.host}`);
  }
  get path() {
    return (this._path ||= this.url || "/");
  }
  get href() {
    return (this._href ||= `${this.origin}${this.path}`);
  }
  get _url() {
    return (this.__url ||= new URL(this.href));
  }
  get pathname() {
    return this._url.pathname;
  }
  get search() {
    return this._url.search;
  }
  get searchParams() {
    return this._url.searchParams;
  }
  get parsedPath() {
    return (this._parsedPath ||= parsePath(this.pathname));
  }
  get dir() {
    return this.parsedPath.dir;
  }
  get base() {
    return this.parsedPath.base;
  }
  get name() {
    return this.parsedPath.name;
  }
  get ext() {
    return this.parsedPath.ext;
  }
  get userAgent() {
    return this.headers["user-agent"] || "";
  }
  get accepts() {
    return (this._accepts ||= accepts(this as any));
  }
  type(type: string) {
    return ((this._type ||= Object.create(null))[type] ??= this.accepts.type(type));
  }
  get types(): string[] {
    return (this._types ||= this.accepts.types() as any);
  }
  encoding(encoding: string) {
    return ((this._encoding ||= Object.create(null))[encoding] ??= this.accepts.encoding(encoding));
  }
  get encodings() {
    return (this._encodings ||= this.accepts.encodings());
  }
  charset(charset: string) {
    return ((this._charset ||= Object.create(null))[charset] ??= this.accepts.charset(charset));
  }
  get charsets() {
    return (this._charsets ||= this.accepts.charsets());
  }
  language(language: string) {
    return ((this._language ||= Object.create(null))[language] ??= this.accepts.language(language));
  }
  get languages() {
    return (this._languages ||= this.accepts.languages());
  }
  get cookie() {
    return (this._cookie ||= this.headers.cookie ? parseCookie(this.headers.cookie) : {});
  }
  get sessionId() {
    return this.cookie.a;
  }
  sessionStore(key: string): Promise<string>;
  sessionStore(key: string, value: string): Promise<void>;
  async sessionStore(key: string, value?: string): Promise<string | void> {
    if (value === undefined) {
      return this._sessionStore[key];
    } else {
      this._sessionStore[key] = value;
    }
  }
  async __session() {
    let session!: { [key: string]: any };

    if (this.sessionId) {
      try {
        const data = await this.sessionStore(this.sessionId);

        if (typeof data === "string") {
          session = JSON.parse(data);

          if (session !== null || typeof session !== "object") {
            session = {};
          } else {
            this.___session = data;
          }
        } else {
          session = {};
        }
      } catch {
        session = {};
      }
    } else {
      session = {};
    }

    return session;
  }
  session() {
    return (this._session ||= this.__session());
  }
}

Request.prototype.response = null as any;
Request.prototype.port = "";
Request.prototype._host = null;
Request.prototype._origin = null;
Request.prototype._path = null;
Request.prototype._href = null;
Request.prototype.__url = null;
Request.prototype._parsedPath = null;
Request.prototype._accepts = null;
Request.prototype._type = null;
Request.prototype._types = null;
Request.prototype._encoding = null;
Request.prototype._encodings = null;
Request.prototype._charset = null;
Request.prototype._charsets = null;
Request.prototype._language = null;
Request.prototype._languages = null;
Request.prototype._cookie = null;
Request.prototype._sessionStore = Object.create(null);
Request.prototype.___session = "{}";
Request.prototype._session = null;
