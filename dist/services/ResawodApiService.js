"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResawodApiService = exports.LOGIN_METHOD = exports.LOGIN_ENDPOINT = exports.RESASOCIAL_BASE_URL = void 0;
exports.RESASOCIAL_BASE_URL = 'https://api.resasocial.com';
exports.LOGIN_ENDPOINT = '/user/login';
exports.LOGIN_METHOD = 'POST';
class ResawodApiService {
    static encodeFormData(data) {
        return Object.entries(data)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join('&');
    }
    static async login(credentials, httpRequest) {
        const loginOptions = {
            method: exports.LOGIN_METHOD,
            url: `${exports.RESASOCIAL_BASE_URL}${exports.LOGIN_ENDPOINT}`,
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
        const response = await httpRequest(loginOptions);
        if (!response.jwt_token) {
            throw new Error('Could not find jwt_token in login response');
        }
        return response;
    }
    static async getSportUserToken(resasocialToken, idUser, applicationId, httpRequest) {
        const sportTokenOptions = {
            method: 'GET',
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
        const response = await httpRequest(sportTokenOptions);
        if (!response.jwt_token) {
            throw new Error('Could not get Nubapp token from getSportUserToken');
        }
        return response.jwt_token;
    }
    static extractUserId(loginResponse, applicationId) {
        let idUser;
        if (loginResponse.applications && Array.isArray(loginResponse.applications)) {
            const app = loginResponse.applications.find((a) => a.id_application === applicationId);
            if (app) {
                idUser = app.id_user;
            }
        }
        if (!idUser && loginResponse.id_user) {
            idUser = loginResponse.id_user;
        }
        if (!idUser) {
            throw new Error('Could not find user ID in login response');
        }
        return idUser;
    }
    static async authenticate(credentials, httpRequest) {
        const loginResponse = await this.login(credentials, httpRequest);
        const resasocialToken = loginResponse.jwt_token;
        const idUser = this.extractUserId(loginResponse, credentials.applicationId);
        const nubappToken = await this.getSportUserToken(resasocialToken, idUser, credentials.applicationId, httpRequest);
        return {
            resasocialToken,
            nubappToken,
            idUser,
        };
    }
    static async getUserFutureBookings(nubappToken, applicationId, idUser, limit, httpRequest) {
        const options = {
            method: 'POST',
            url: 'https://sport.nubapp.com/api/v4/users/getUserFutureBookings.php',
            body: this.encodeFormData({
                app_version: '5.12.03',
                id_application: applicationId,
                id_user: idUser,
                limit: limit,
                include_waiting_list: 'true',
            }),
            headers: {
                'Authorization': `Bearer ${nubappToken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'nubapp-origin': 'user_apps',
                'Origin': 'https://box.resawod.com',
                'Referer': 'https://box.resawod.com/',
            },
            returnFullResponse: false,
        };
        if (!httpRequest) {
            throw new Error('httpRequest function is required');
        }
        const responseRaw = await httpRequest(options);
        return typeof responseRaw === 'string' ? JSON.parse(responseRaw) : responseRaw;
    }
    static async getActivitiesCalendar(nubappToken, applicationId, categoryActivityId, idUser, startDate, endDate, httpRequest) {
        const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        };
        const startFormatted = formatDate(startDate);
        const endFormatted = formatDate(endDate);
        const options = {
            method: 'POST',
            url: 'https://sport.nubapp.com/api/v4/activities/getActivitiesCalendar.php',
            body: this.encodeFormData({
                app_version: '5.12.03',
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
                'nubapp-origin': 'user_apps',
                'Origin': 'https://box.resawod.com',
                'Referer': 'https://box.resawod.com/',
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
exports.ResawodApiService = ResawodApiService;
//# sourceMappingURL=ResawodApiService.js.map