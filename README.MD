![iroh](https://i.imgur.com/fac6Za2.png)
# iroh
A nice account api that gives out jwt's

## generate the signing keys:
this generates the keys for the rs256 algorithm

`openssl genrsa -out jwtRS256.key 2048` generate the private key

`openssl rsa -in jwtRS256.key -outform PEM -pubout -out jwtRS256.key.pub` get the public key
