# Exemples de Workflows n8n pour Resawod

Ce dossier contient des exemples de workflows n8n pour comprendre le fonctionnement de l'API Resawod.

## resawod-authentication-workflow.json

Ce workflow démontre la séquence complète d'authentification pour Resawod/Nubapp API.

### Étapes du workflow

1. **Step 1: Login to Resasocial**
   - URL: `POST https://api.resasocial.com/user/login`
   - Body: `{ username, password }`
   - Retour: `{ jwt_token, applications[], id_user }`

2. **Step 2: Extract User Data**
   - Extrait le `jwt_token` (resasocialToken)
   - Extrait l'`id_user` depuis `applications[0].id_user`
   - Stocke l'`applicationId` (à configurer)

3. **Step 3: Get Nubapp Token**
   - URL: `GET https://api.resasocial.com/secure/user/getSportUserToken?id_user={idUser}&id_application={applicationId}`
   - Headers: `Authorization: Bearer {resasocialToken}`
   - Retour: `{ jwt_token }` (nubappToken)

4. **Step 4: Final Authentication Data**
   - Combine toutes les données d'authentification :
     - `nubappToken` : Token pour les API Nubapp
     - `resasocialToken` : Token Resasocial
     - `idUser` : ID de l'utilisateur
     - `applicationId` : ID de l'application

### Comment utiliser

1. Importer le fichier JSON dans n8n (Settings > Import Workflow)
2. Remplacer les valeurs suivantes :
   - `YOUR_USERNAME` : Votre nom d'utilisateur Resawod
   - `YOUR_PASSWORD` : Votre mot de passe Resawod
   - `YOUR_APPLICATION_ID` : L'ID de votre box/salle (ex: 74239463)
3. Exécuter le workflow

### Résultat

À la fin du workflow, vous obtiendrez un objet contenant :
```json
{
  "nubappToken": "eyJ0eXAi...",
  "resasocialToken": "eyJ0eXAi...",
  "idUser": "3520851",
  "applicationId": "74239463"
}
```

Ces données peuvent ensuite être utilisées pour :
- Récupérer les slots disponibles (`getActivitiesCalendar`)
- Créer des réservations (`bookActivityCalendar`)
- Récupérer vos réservations (`getUserFutureBookings`)
- Etc.

### Notes

⚠️ **Ce workflow est fourni à titre d'exemple éducatif uniquement.**

Si vous utilisez n8n dans un environnement de production, il est fortement recommandé d'utiliser le node communautaire **n8n-nodes-resawod** qui gère automatiquement toute cette séquence d'authentification de manière sécurisée.

### Avantages du node n8n-nodes-resawod

Au lieu de gérer manuellement 4 étapes d'authentification, le node Resawod :
- ✅ Authentifie automatiquement avec vos credentials
- ✅ Gère le rafraîchissement des tokens
- ✅ Fournit une interface simple pour toutes les opérations
- ✅ Inclut la validation des erreurs
- ✅ Maintient une architecture propre
- ✅ Stocke les credentials de manière sécurisée dans n8n

Installation : `npm install n8n-nodes-resawod`

