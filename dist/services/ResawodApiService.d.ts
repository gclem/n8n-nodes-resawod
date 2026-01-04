import { IHttpRequestMethods, IHttpRequestOptions } from 'n8n-workflow';
export declare const RESASOCIAL_BASE_URL = "https://api.resasocial.com";
export declare const LOGIN_ENDPOINT = "/user/login";
export declare const LOGIN_METHOD: IHttpRequestMethods;
export interface ResawodCredentials {
    username: string;
    password: string;
    applicationId: string;
    categoryActivityId: string;
}
export interface LoginResponse {
    jwt_token: string;
    applications?: Array<{
        id_application: string;
        id_user: string;
    }>;
    id_user?: string;
}
export interface SportTokenResponse {
    jwt_token: string;
}
export interface LoginResult {
    resasocialToken: string;
    nubappToken: string;
    idUser: string;
}
export declare class ResawodApiService {
    static encodeFormData(data: Record<string, string | number>): string;
    static login(credentials: ResawodCredentials, httpRequest?: (options: IHttpRequestOptions) => Promise<unknown>): Promise<LoginResponse>;
    static getSportUserToken(resasocialToken: string, idUser: string, applicationId: string, httpRequest?: (options: IHttpRequestOptions) => Promise<unknown>): Promise<string>;
    static extractUserId(loginResponse: LoginResponse, applicationId: string): string;
    static authenticate(credentials: ResawodCredentials, httpRequest?: (options: IHttpRequestOptions) => Promise<unknown>): Promise<LoginResult>;
    static getUserFutureBookings(nubappToken: string, applicationId: string, idUser: string, limit: number, httpRequest?: (options: IHttpRequestOptions) => Promise<unknown>): Promise<unknown>;
    static getActivitiesCalendar(nubappToken: string, applicationId: string, categoryActivityId: string, idUser: string, startDate: string, endDate: string, httpRequest?: (options: IHttpRequestOptions) => Promise<unknown>): Promise<unknown>;
}
