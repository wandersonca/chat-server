# chat-server

# How to run locally
1. Install Nodejs v16
2. Install dependancies: `npm install`
3. Install Docker
4. Start Redis with Docker: `docker run -p 6379:6379 redis`
5. Start the app: `npm run dev`

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
echo -n '{"name":"will","publicKey":"-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEXX/QhZeHIg5uyAye74agscxXrRB6\n8Y9mcTuIaAyNIaRLQeqFN/FL1rJ4EzO2xO2oVOmDP1mv43RO3gtqfAnR3Q==\n-----END PUBLIC KEY-----"}' > data.txt
openssl dgst -sha256 -sign private.pem data.txt > signature.bin
base64 signature.bin --wrap=0 > signature.base64
echo "Content-Type: application/json" > authheader.txt
echo "Authentication-Signature: $(base64 signature.bin --wrap=0)" >> authheader.txt
curl -X POST -H @authheader.txt -d @data.txt http://localhost:3000/account
# Save the ID and test it out
curl http://localhost:3000/account/1
```
4. Send a message:
```sh
echo -n '{"senderId":"3","recipientIds":"4","message":"hi"}' > data.txt
openssl dgst -sha256 -sign private.pem data.txt > signature.bin
base64 signature.bin --wrap=0 > signature.base64
echo "Content-Type: application/json" > authheader.txt
echo "Authentication-Signature: $(base64 signature.bin --wrap=0)" >> authheader.txt
curl -X POST -H @authheader.txt -d @data.txt http://localhost:3000/message
```
5. Check for messages:
```sh
curl http://localhost:3000/message/4
```
