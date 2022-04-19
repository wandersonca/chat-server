# chat-server
This is a proof-of-concept chat server using ECDSA signatures to verify API calls with EC 256-bit PEM keys. You can also use these keys for a Diffie Hellman key exchange to perform AES encryption for the message contents. 

You can find an campanion iPhone app for this server [here](https://github.com/wandersonca/crypto-chat).

# How to run locally
1. Install Nodejs v16
2. Install dependancies: `npm install`
3. Install Docker
4. Start Redis with Docker: `docker run -p 6379:6379 redis`
5. Start the app: `npm run dev`

# Heroku deployment
This app can be run locally with `nodejs` and `docker`, however, I also deploy the app to Heroku. For local execution, use http://localhost:3000, for the production deployment substitute for `https://murmuring-journey-13653.herokuapp.com/`. Deployments to the `main` branch will automatically get deployed to Heroku.

# How to generate keys and validate signatures using `openssl`
1. Install openssl
2. Run the following to generate a key-pair:
```sh
openssl ecparam -genkey -name prime256v1 -noout -out private.pem
openssl ec -in private.pem -pubout -out public.pem
```
3. You can create signatures like so:
```sh
openssl dgst -sha256 -sign private.pem data.txt > signature.bin
base64 signature.bin > signature.base64
```
4. You can verify signatures like so:
```sh
base64 -d signature.base64 -o signature.bin
openssl dgst -sha256 -verify public.pem -signature signature.bin data.txt
```

# How to test the APIs
1. Install cURL
2. Generate a key-pair, see above. 
3. Create an account:
```sh
# Testing against production:
export HOST="https://murmuring-journey-13653.herokuapp.com/account"
# Testing against local server 
export HOST="http://localhost:3000"

# MacOS (weird newline escaping requriement, also base64 args are different)
echo -n '{"name":"will","publicKey":"-----BEGIN PUBLIC KEY-----\\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEvQEyMB5Umy/LKMrk58BiKBoOHwaN\\n8JTxo3LZ2Jsb62mjovD9yVnGTuLQfvApeySw9uqFSq3hT8ZcvY48mYk7gg==\\n-----END PUBLIC KEY-----"}' > data.txt
openssl dgst -sha256 -sign private.pem data.txt > signature.bin
base64 -i signature.bin -o signature.base64

# Linux 
echo -n '{"name":"will","publicKey":"-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEXX/QhZeHIg5uyAye74agscxXrRB6\n8Y9mcTuIaAyNIaRLQeqFN/FL1rJ4EzO2xO2oVOmDP1mv43RO3gtqfAnR3Q==\n-----END PUBLIC KEY-----"}' > data.txt
openssl dgst -sha256 -sign private.pem data.txt > signature.bin
base64 signature.bin --wrap=0 > signature.base64

echo "Content-Type: application/json" > authheader.txt
echo "Authentication-Signature: $(cat signature.base64)" >> authheader.txt
curl -X POST -H @authheader.txt -d @data.txt ${HOST}/account
# Save the ID and test it out
curl ${HOST}/account/1
```
4. Send a message:
```sh
echo -n '{"senderId":"1","recipientId":"2","message":"hi"}' > data.txt
openssl dgst -sha256 -sign private.pem data.txt > signature.bin

# MacOS (base64 args are different)
base64 -i signature.bin -o signature.base64
# Linux 
base64 signature.bin --wrap=0 > signature.base64

echo "Content-Type: application/json" > authheader.txt
echo "Authentication-Signature: $(cat signature.base64)" >> authheader.txt
curl -X POST -H @authheader.txt -d @data.txt ${HOST}/message
```

5. Check for messages:
```sh
echo -n '2' > data.txt
openssl dgst -sha256 -sign private.pem data.txt > signature.bin

# MacOS (base64 args are different)
base64 -i signature.bin -o signature.base64
# Linux 
base64 signature.bin --wrap=0 > signature.base64

echo "Content-Type: application/json" > authheader.txt
echo "Authentication-Signature: $(cat signature.base64)" >> authheader.txt
curl -H @authheader.txt ${HOST}/message/2
```

