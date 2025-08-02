# GUIDE D’UTILISATION API

## L’API SMS de MTN

### Découvrez l’API de la plateforme Tinda de MTN! Une solution unique, simple et rapide pour

### envoyer des messages sms et mails pour diverses utilisations.

Vous pouvez l’utiliser pour vos campagnes de communication, pour envoyer des messages de notification,
des codes d’accès à usage unique (OTP) pour la double authentification etc.

Notre API **REST** est facile à intégrer à votre logiciel, site internet ou toute autre application Saas, vous
permettant ainsi d'améliorer l'efficacité de votre organisation et d'augmenter la satisfaction de vos clients.
Les développeurs apprécieront particulièrement nos librairies d'intégration évolutives et régulièrement
maintenues.

N'attendez pas plus pour profiter de notre expertise de communication par SMS et par MAILS!
Choisissez l'API **Tinda** de MTN pour une intégration rapide et facile, et des résultats immédiats.

## Prérequis

Pour utiliser l'API SMS, vous devez vous assurer de disposer de certains prérequis techniques. Tout d'abord,
l'URL de base de l'API est :

**https://sms.mtncongo.net/api/sms/**

Ensuite, pour accéder à l'API, vous devez obtenir un token d'authentification disponible dans l'onglet info
API de votre interface Profil. Ce token doit être inséré dans l'en-tête (header fields) de chaque requête que
vous envoyez à l'API, avec l'en-tête Authorization: Token-xxxxxxxxxxxxxxxx où "xxxxxxxxxxxxxxxx"
représente votre token personnel.

Le type MIME accepté par l'API est le format **JSON** , donc les données que vous envoyez à l'API doivent
être structurées en JSON. Vous devez également définir l'en-tête Content-Type comme étant
application/json.

Voici un exemple qui inclut les conditions préalables requises :


**Champs d'en-tête (header fields)**

## Message :

## Type : chaîne de caractères

## Description : Le message SMS à envoyer doit être encodé en URL et ne peut contenir

## que les caractères suivants en ASCII pour être traité comme GSM : a-z A-Z 0 - 9

## ~!@#$%^&*()-_=+][?<>,'.":/{} (Espace blanc)

Tous les autres caractères seront traités comme Unicode.

## Nombre de caractères : Il est important de noter que chaque SMS a une limite de

caractères en fonction du nombre de messages qu'il contient :

1 message = 160 caractères possibles

2 messages = 306 caractères possibles (153 + 153)

3 messages = 459 caractères possibles (153 + 153 + 153)

4 messages = 612 caractères possibles (153 + 153 + 153 + 153)

5 messages = 760 caractères possibles (153 + 153 + 153 + 153 + 153)

6 messages = 918 caractères possibles (153 + 153 + 153 + 153 + 153 + 153)

7 messages = 1071 caractères possibles (153 + 153 + 153 + 153 + 153 + 153 + 153)

Et ainsi de suite...

_Exemple de message SMS :_

"Salut! Merci d'avoir utilisé notre service. Nous espérons que vous appréciez votre expérience jusqu'à
présent."

Ce message contient 111 caractères et peut être envoyé en tant que message unique car il est inférieur à la
limite de 160 caractères.

#### KEY VALUE

```
CONTENT-TYPE application/json
```
```
AUTHORIZATION Token EJQ15pg5cEYsotgQaGyCHRxnPvmAemamOh6w7YRDif
```

## Envoi SMS et mails Non personnalisés

## Tableau de mots-clés possibles :

## Lors de l’envoi de la requête, il y a au moins un email de destination renseigné :

## ▪ Si le msg_mail n’est pas renseigné ; l’API prendra automatiquement le message

## du paramètre msg pour le contenu du mail.

## ▪ Si l’objet_mail n’est pas renseigné ; l’API prendra automatiquement le contenu

## du sender pour l’objet du mail.

## ▪ Si le paramètre email n’est pas renseigné ; l’API n’enverra pas de mail.

```
key type description obligatoire
```
```
msg text Contenu du message SMS oui
```
```
msg_mail text Contenu du mail non
```
```
objet_mail text L’objet du mail non
```
```
email text Email destinataire(s) (séparé avec des virgules, 1000
emails au max)
```
```
non
```
```
sender Char(11) Nom expéditeur enregistré sur la plateforme TINDA oui
```
```
receivers text Numéro destinataire(s) (séparé par des virgules :
242050010101, 242068463499) 1000 numéros au max.
```
```
oui
```
```
date_envois text Format Json YYYY-MM-DDTHH:MM:SS (20 21 - 07 -
22T06:17:32.500132) d’envoi différé
```
```
non
```
```
externalId int Identifiant externe du client pour vérification de statut non
```
```
callback_url text Url client de réception des réponses de l’API non
```

## Exemple :

## Réponse :

## Exemple de réponse avec succès :

#### {

**"resultat": "envoyé (coût: 46 crédits)",**

**"status": "200",**

**"id": "10"**

**}**


## Envoi SMS et mails Personnalisés

## Tableau de mots-clés possibles :

**A savoir :**

```
Key Type Description Obligatoire
```
### msg text Contenu du message Oui

### msg_mail text^ Contenu du mail^ Non^

### objet_mail text L’objet du mail Non

### email text^ Email destinataire(s) (séparé avec des virgules)^ Non^

### isemail int

```
Valeur déterminant si l’envoi de mail doit être pris en
compte ou non (soit 1 pour oui ou 0 pour non) (valeur
par défaut : 0)
```
```
Non
```
### sender Char(11)^ Nom expéditeur enregistré sur la plateforme TINDA^ Oui^

### params text^

```
Clé de renseignement d’infos des destinataires par ligne
de façon personnalisée (infos séparées par des virgules
pour un destinataire et \r\n par destinataire (CSV))
```
```
Oui
```
### date_envois text^ Format Json YYYY22T06:17:32.500132) d’envoi différé-MM-DDTHH:MM:SS (2021 -^07 - Non^

### externalId int Identifiant externe du client pour vérification de statut Non

### callback_url text^ Url client de réception des réponses de l’API^ Non^

Lors de l’envoi de la requête, le paramètre **isemail** est renseigné à 1 :

- Si le **msg_mail** n’est pas renseigné ; l’API prendra automatiquement le message du paramètre **msg**
    pour le contenu du mail.
- Si **l’objet_mail** n’est pas renseigné ; l’API prendra automatiquement le contenu du **sender** pour
    l’objet du mail.

Lors du renseignement des infos de personnalisation du paramètre params :

1. Dans le message (paramètre **msg** et **msg_mail** ) :

Les éléments de substitution sont remplacés par :P1 pour le premier élément, :P2 pour le deuxième
élément, :P3 pour le troisième élément, :P4 pour le quatrième élément et :P5 pour le cinquième élément.

2. Dans la personnalisation (paramètre **params** )
    Les emails doivent toujours être placés en avant dernière place sur la ligne d’infos d’un destinataire
    juste avant le numéro de téléphone.


```
Le nombre de paramètres possible pour un destinataire est de cinq (5).
```
## Résumé :

Le paramètre **params** est considéré comme un fichier CSV dont le séparateur colonne est point-virgule ‘’;’’
et le séparateur ligne est ‘’\r\n’’.

## Exemple :


**Réponse :**

Exemple de réponse avec une erreur :

#### {

**"resultat": "Erreur MSISDN: 24206846349",**

**"detail": "format numéro incorrect dans le paramètre receivers: 24206846349",**

**"status": "404"**

**}**

## Codes et status réponses

#### KEY STATUT DESCRIPTION

```
200 / 201 Ok La demande a été traitée avec succès
400 Bad Request Votre demande contenait des données invalides ou manquantes
401 Unauthorized L'authentification a échoué ou l'en-tête d'authentification n'a pas été fourni
403 FORBIDDEN Refus d’autorisation d’accès.
404 Not Found
```
```
L'URI ne correspond à aucune des ressources reconnues, ou, si vous
demandez une ressource spécifique avec un ID, cette ressource n'existe
pas
405 Method Allowed Not La méthode de requête HTTP que vous essayez d'utiliser n'est pas autorisée. Faire une requête OPTIONS pour voir les méthodes autorisées
```
```
406 Not Acceptable Le type de contenu Accepter que vous demandez n'est pas pris en charge par l'API REST
415 Unsupported Media Type L'en-tête Content-Type n'est pas pris en charge par l'API REST
```
**Statut Réponse :**

```
Key Description
Id Identifiant unique serveur
```
```
Statut Code réponse
```
```
Résultat Message du résultat avec le coût du sms
```

## Demande de Statut SMS :

Il est possible de vérifier le statut de la requête envoyée en précisant l’id serveur reçu après l’envoi du
message et de préciser le paramètre **op** , avec la valeur **status** dans la partie data de la requête. Comme
suit :

## {

## "op": "status",

## "id": "26"

## }

## Exemple :


## Réponse :

## Exemple de réponse avec succès :

## {

## "resultat": [

## "242056753822, 1, Livré au téléphone",

## "242068463499, 2, Non remis au téléphone"

## ],

## "status": "200",

## "externalId": 15

## }

## Le code réponse

### Code description

### 0 En attente^

### 1 Livré au téléphone^

### 2 Non remis au téléphone^

### 4 Mis en file d'attente sur SMSC^

### 8 Livré au SMSC^

### 16 rejet^ smsc^


---


# GUIDE D’UTILISATION API SMS MTN

## Usage

Pour utiliser l'API SMS, vous devez vous assurer de disposer de certains prérequis techniques. Tout d'abord, l'URL de base de l'API est https://sms.mtncongo.net/api/sms/

Ensuite, pour accéder à l'API, vous devez obtenir un token d'authentification disponible dans l'onglet info API de votre interface Profil. Ce token doit être inséré dans l'en-tête (header fields) de chaque requête que vous envoyez à l'API, avec l'en-tête Authorization: Token-xxxxxxxxxxxxxxxx où "xxxxxxxxxxxxxxxx" représente votre token personnel.
Le type MIME accepté par l'API est le format JSON, donc les données que vous envoyez à l'API doivent être structurées en JSON. Vous devez également définir l'en-tête Content-Type comme étant application/json.

Voici un exemple qui inclut les conditions préalables requises:

```python
POST https://sms.mtncongo.net/api/sms/

header {
    "Content-type": "application/json; charset=utf-8",
    "Authorization": "Token xxxxxxxxxxxxxxxxxxxxxxx"
}

data {
    # Informations à inclure dans le message SMS
}
```


## Envoie SMS et mails Non personnalisé

```python
POST https://sms.mtncongo.net/api/sms/

header {
    "Content-type": "application/json; charset=utf-8",
    "Authorization": "Token xxxxxxxxxxxxxxxxxxxxxxx"
}

data {
    "msg": "Hello word 21",
    "msg_mail": "Hello word 20\n brel maxpro",
    "objet_mail": "test mail brel",
    "receivers": "242068463499,242068463499",
    "email": "brel.asseh@gmail.com",
    "date_envois": "2021-07-22T07:18:08.831717",
    "sender": "BES",
    "externalId": 10,
    "callback_url": "https://www.besnode.com/api/momo_cb"
}

```

## Envoie SMS et mails Personnalisé

```python
POST https://sms.mtncongo.net/api/sms/

header {
    "Content-type": "application/json; charset=utf-8",
    "Authorization": "Token xxxxxxxxxxxxxxxxxxxxxxx"
}

data {
    "msg": "Hello :P1 :P2, word bulk.",
    "msg_mail": "Hello :P1 :P2 word 20\n brel maxpro",
    "sender": "BES",
    "objet_mail": "test mail brel",
    "isemail": "1",
    "date_envois": "2021-07-22T07:18:08.831717",
    "params": "ASSEH;Brel;info@besnode.com;242064504545\r\nMOTOKOUA;Hegel;support@besnode.com;242057360000",
    "externalId": 10,
    "callback_url": "https://www.besnode.com/api/get_status"
}
```


## Codes et vérification status réponses

```python
POST https://sms.mtncongo.net/api/sms/

header {
    "Content-type": "application/json; charset=utf-8",
    "Authorization": "Token xxxxxxxxxxxxxxxxxxxxxxx"
}

data {
    "op": "status",
    "id": "26"
}
```

