const NodeCache = require("node-cache");
const uuidV4 = require('uuid/v4');
const sessionCache = new NodeCache({stdTTL: 300, checkperiod: 60});

var SessionManager = {

    /**
     *Create a new session.
     */
    createSession(userId)
    {
        var sessionId = uuidV4();
        var sessionObj = {'sessionId': sessionId}
        sessionCache.set(userId, sessionObj);
        console.log("Generated New SessionId for " + userId + " sessionID : " + sessionId);
        return sessionObj;
    },
    destroySession(userId) {
        console.log("Destroy Session for " + userId);
        sessionCache.del(userId);

    },
    getSessionId(userId) {
        var sessionId;
        try {
            sessionId = sessionCache.get(userId, true).sessionId;
        } catch (error) {
            sessionId = this.createSession(userId).sessionId;
        }
        console.log("Get SessionID : " + sessionId);
        return sessionId;
    },
    getSessionObj(userId, createSession) {
        var sessionObj;
        try {
            sessionObj = sessionCache.get(userId, true);
        } catch (error) {
            if (createSession) {
                sessionObj = this.createSession(userId)
            } else {
                throw new Error("No Session found for user : " + userId);
            }

        }
        console.log("Get SessionID : " + JSON.stringify(sessionObj));
        return sessionObj;
    },
    addRetryCount(userId, attr){
        var sessionObj;
        try {
            sessionObj = this.getSessionObj(userId, false);
            console.log(attr + " in session is " + sessionObj[attr]);
            if (typeof sessionObj[attr] === 'undefined') {
                sessionObj[attr] = 0;
            }
            sessionObj[attr] += 1;
            sessionCache.set(userId, sessionObj);
            return sessionObj[attr] ;
            console.log("Incremented Retry Count : " + sessionObj[attr]);
        } catch (error) {
            throw error;
        }
        return 1;
    }

}

module.exports = SessionManager;