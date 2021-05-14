import { IncomingMessage } from "http";
import { basename, extname } from "path";
import { fileURLToPath } from "url";
import base64url from "@mo36924/base64url";
import accepts, { Accepts } from "accepts";
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

export const sid = () => base64url(v4(null, Buffer.alloc(16)).toString("base64"));

export class Request extends IncomingMessage {
  response!: Response;
  port!: string;
  private _host!: string | null;
  private _origin!: string | null;
  private __url!: string | null;
  private _href!: string | null;
  private $$url!: URL | null;
  private _path!: string | null | undefined;
  private _basename!: string | null;
  private _extname!: string | null;
  private _userAgent!: string | null;
  private _accepts!: Accepts | null;
  private _type!: { [type: string]: string | false } | null;
  private _types!: string[] | null;
  private _encoding!: { [encoding: string]: string | false } | null;
  private _encodings!: string[] | null;
  private _charset!: { [charset: string]: string | false } | null;
  private _charsets!: string[] | null;
  private _language!: { [language: string]: string | false } | null;
  private _languages!: string[] | null;
  private _cookie!: Cookie | null;
  private _sessionStore!: Session;
  private ___session!: string;
  private _session!: Promise<Session> | null;
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
  get _url() {
    return (this.__url ||= this.url || "/");
  }
  get href() {
    return (this._href ||= `${this.origin}${this._url}`);
  }
  get $url() {
    return (this.$$url ||= new URL(this.href));
  }
  get pathname() {
    return this.$url.pathname;
  }
  get search() {
    return this.$url.search;
  }
  get searchParams() {
    return this.$url.searchParams;
  }
  get path() {
    if (this._path === null) {
      try {
        this._path = fileURLToPath(`file://${this._url}`);
      } catch {
        this._path = undefined;
      }
    }

    return this._path;
  }
  get basename() {
    return (this._basename ??= basename(this.pathname));
  }
  get extname() {
    return (this._extname ??= extname(this.basename));
  }
  get userAgent() {
    return (this._userAgent ??= typeof this.headers["user-agent"] === "string" ? this.headers["user-agent"] : "");
  }
  get accepts() {
    return (this._accepts ||= accepts(this as any));
  }
  type(type: string): string | false;
  type(types: string[]): string | false;
  type(type: string | string[]) {
    return ((this._type ||= Object.create(null))[typeof type === "string" ? type : type.join()] ??= this.accepts.type(
      type as any,
    ));
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

const prototype: any = Request.prototype;
prototype.response = null;
prototype.port = "";
prototype._host = null;
prototype._origin = null;
prototype.__url = null;
prototype._href = null;
prototype.$$url = null;
prototype._path = null;
prototype._basename = null;
prototype._extname = null;
prototype._userAgent = null;
prototype._accepts = null;
prototype._type = null;
prototype._types = null;
prototype._encoding = null;
prototype._encodings = null;
prototype._charset = null;
prototype._charsets = null;
prototype._language = null;
prototype._languages = null;
prototype._cookie = null;
prototype._sessionStore = Object.create(null);
prototype.___session = "{}";
prototype._session = null;
