import { IHttpRequestMethods, IHttpRequestOptions } from 'n8n-workflow';

// API Constants
export const RESASOCIAL_BASE_URL = 'https://api.resasocial.com';
export const LOGIN_ENDPOINT = '/user/login';
export const LOGIN_METHOD = 'POST' as IHttpRequestMethods;

export const NUBAPP_BASE_URL = 'https://sport.nubapp.com/api/v4';
export const APP_VERSION = '5.12.03';
export const NUBAPP_ORIGIN = 'user_apps';
export const BOX_RESAWOD_URL = 'https://box.resawod.com';

export interface ResawodCredentials {
	username: string;
	password: string;
	applicationId: string;
	categoryActivityId: string;
}

export interface LoginResponse {
	jwt_token: string;
	applications?: Array<{ id_application: string; id_user: string }>;
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

export class ResawodApiService {
	/**
	 * Helper function to encode form data
	 */
	static encodeFormData(data: Record<string, string | number>): string {
		return Object.entries(data)
			.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
			.join('&');
	}

	/**
	 * Login to Resasocial and get JWT token
	 */
	static async login(
		credentials: ResawodCredentials,
		httpRequest?: (options: IHttpRequestOptions) => Promise<unknown>,
	): Promise<LoginResponse> {
		const loginOptions: IHttpRequestOptions = {
			method: LOGIN_METHOD,
			url: `${RESASOCIAL_BASE_URL}${LOGIN_ENDPOINT}`,
			body: {
				username: credentials.username,
				password: credentials.password,
			},
			headers: {
				'Content-Type': 'application/json',
				'Origin': 'https://box.resawod.com',
				'Referer': 'https://box.resawod.com/',
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'X-Requested-With': 'XMLHttpRequest',
			},
			json: true,
		};

		if (!httpRequest) {
			throw new Error('httpRequest function is required');
		}

		const response = await httpRequest(loginOptions) as LoginResponse;
		
		if (!response.jwt_token) {
			throw new Error('Could not find jwt_token in login response');
		}

		return response;
	}

	/**
	 * Get Sport User Token (Nubapp JWT) from Resasocial token
	 */
	static async getSportUserToken(
		resasocialToken: string,
		idUser: string,
		applicationId: string,
		httpRequest?: (options: IHttpRequestOptions) => Promise<unknown>,
	): Promise<string> {
		const sportTokenOptions: IHttpRequestOptions = {
			method: 'GET' as IHttpRequestMethods,
			url: `https://api.resasocial.com/secure/user/getSportUserToken?id_user=${idUser}&id_application=${applicationId}`,
			headers: {
				'Authorization': `Bearer ${resasocialToken}`,
				'Origin': 'https://box.resawod.com',
				'Referer': 'https://box.resawod.com/',
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			},
			json: true,
		};

		if (!httpRequest) {
			throw new Error('httpRequest function is required');
		}

		const response = await httpRequest(sportTokenOptions) as SportTokenResponse;
		
		if (!response.jwt_token) {
			throw new Error('Could not get Nubapp token from getSportUserToken');
		}

		return response.jwt_token;
	}

	/**
	 * Extract user ID from login response
	 */
	static extractUserId(loginResponse: LoginResponse, applicationId: string): string {
		let idUser: string | undefined;

		if (loginResponse.applications && Array.isArray(loginResponse.applications)) {
			const app = loginResponse.applications.find((a) => a.id_application === applicationId);
			if (app) {
				idUser = app.id_user;
			}
		}

		// Fallback to direct id_user if available
		if (!idUser && loginResponse.id_user) {
			idUser = loginResponse.id_user;
		}

		if (!idUser) {
			throw new Error('Could not find user ID in login response');
		}

		return idUser;
	}

	/**
	 * Complete authentication flow: Login → Get Sport Token
	 */
	static async authenticate(
		credentials: ResawodCredentials,
		httpRequest?: (options: IHttpRequestOptions) => Promise<unknown>,
	): Promise<LoginResult> {
		// Step 1: Login to Resasocial
		const loginResponse = await this.login(credentials, httpRequest);
		const resasocialToken = loginResponse.jwt_token;

		// Step 2: Extract user ID
		const idUser = this.extractUserId(loginResponse, credentials.applicationId);

		// Step 3: Get Nubapp token
		const nubappToken = await this.getSportUserToken(
			resasocialToken,
			idUser,
			credentials.applicationId,
			httpRequest,
		);

		return {
			resasocialToken,
			nubappToken,
			idUser,
		};
	}

	/**
	 * Get user future bookings
	 */
	static async getUserFutureBookings(
		nubappToken: string,
		applicationId: string,
		idUser: string,
		limit: number,
		httpRequest?: (options: IHttpRequestOptions) => Promise<unknown>,
	): Promise<unknown> {
		const options: IHttpRequestOptions = {
			method: 'POST' as IHttpRequestMethods,
			url: `${NUBAPP_BASE_URL}/users/getUserFutureBookings.php`,
			body: this.encodeFormData({
				app_version: APP_VERSION,
				id_application: applicationId,
				id_user: idUser,
				limit: limit,
				include_waiting_list: 'true',
			}),
			headers: {
				'Authorization': `Bearer ${nubappToken}`,
				'Content-Type': 'application/x-www-form-urlencoded',
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'nubapp-origin': NUBAPP_ORIGIN,
				'Origin': BOX_RESAWOD_URL,
				'Referer': `${BOX_RESAWOD_URL}/`,
			},
			returnFullResponse: false,
		};

		if (!httpRequest) {
			throw new Error('httpRequest function is required');
		}

		const responseRaw = await httpRequest(options);
		return typeof responseRaw === 'string' ? JSON.parse(responseRaw) : responseRaw;
	}

	/**
	 * Get activities calendar
	 */
	static async getActivitiesCalendar(
		nubappToken: string,
		applicationId: string,
		categoryActivityId: string,
		idUser: string,
		startDate: string,
		endDate: string,
		httpRequest?: (options: IHttpRequestOptions) => Promise<unknown>,
	): Promise<unknown> {
		// Format dates as DD-MM-YYYY
		// If already in DD-MM-YYYY format, use as-is
		// If in ISO format (YYYY-MM-DD), convert it
		const formatDate = (dateStr: string): string => {
			// Check if already in DD-MM-YYYY format
			if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
				return dateStr;
			}
			
			// Otherwise, parse and format
			const date = new Date(dateStr);
			const day = String(date.getDate()).padStart(2, '0');
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const year = date.getFullYear();
			return `${day}-${month}-${year}`;
		};

		const startFormatted = formatDate(startDate);
		const endFormatted = formatDate(endDate);

		const options: IHttpRequestOptions = {
			method: 'POST' as IHttpRequestMethods,
			url: `${NUBAPP_BASE_URL}/activities/getActivitiesCalendar.php`,
			body: this.encodeFormData({
				app_version: APP_VERSION,
				id_application: applicationId,
				start_timestamp: startFormatted,
				end_timestamp: endFormatted,
				id_user: idUser,
				id_category_activity: categoryActivityId,
			}),
			headers: {
				'Authorization': `Bearer ${nubappToken}`,
				'Content-Type': 'application/x-www-form-urlencoded',
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'nubapp-origin': NUBAPP_ORIGIN,
				'Origin': BOX_RESAWOD_URL,
				'Referer': `${BOX_RESAWOD_URL}/`,
			},
			returnFullResponse: false,
		};

		if (!httpRequest) {
			throw new Error('httpRequest function is required');
		}

		const responseRaw = await httpRequest(options);
		return typeof responseRaw === 'string' ? JSON.parse(responseRaw) : responseRaw;
	}
}
