import * as forge from 'node-forge'

interface SslRequisites {
  keys: PemKeyRequisites
  certs: CertRequisites
}

interface CertRequisites {
  server: string
  client: string
  ca: string
}

interface KeyRequisites {
  server: forge.pki.rsa.KeyPair
  client: forge.pki.rsa.KeyPair
  ca: forge.pki.rsa.KeyPair
}

interface PemKeyRequisites {
  server: PemKeyPair
  client: PemKeyPair
  ca: PemKeyPair
}

interface PemKeyPair {
  publicKey: string
  privateKey: string
}

export class Ssl {
  public getSslRequisites(host: string): SslRequisites {
    // Generate keys.
    const keys: KeyRequisites = {
      ca: forge.pki.rsa.generateKeyPair(2048),
      server: forge.pki.rsa.generateKeyPair(2048),
      client: forge.pki.rsa.generateKeyPair(2048),
    }

    const certRequisites: CertRequisites = {
      ca: this.getCert(host, 'CA', keys.ca.publicKey, keys.ca.privateKey, null),
      server: '',
      client: '',
    }
    certRequisites.server = this.getCert(host, 'Server', keys.server.publicKey, keys.server.privateKey, keys.ca.privateKey)
    certRequisites.client = this.getCert(host, 'Client', keys.client.publicKey, keys.client.privateKey, keys.ca.privateKey)

    return {
      // Turn all pub/private keys into pem.
      keys: {
        ca: {
          publicKey: forge.pki.publicKeyToPem(keys.ca.publicKey),
          privateKey: forge.pki.privateKeyToPem(keys.ca.privateKey)
        },
        server: {
          publicKey: forge.pki.publicKeyToPem(keys.server.publicKey),
          privateKey: forge.pki.privateKeyToPem(keys.server.privateKey)
        },
        client: {
          publicKey: forge.pki.publicKeyToPem(keys.client.publicKey),
          privateKey: forge.pki.privateKeyToPem(keys.client.privateKey)
        }
      },
      certs: certRequisites
    }
  }

  public getCert(commonName: string, orgUnit: string, pubKey: forge.pki.rsa.PublicKey, privKey: forge.pki.rsa.PrivateKey, caPrivKey: forge.pki.rsa.PrivateKey | null): string {
    const cert = forge.pki.createCertificate()
    const attr = [{
      name: 'commonName',
      value: commonName
    }, {
      name: 'countryName',
      value: 'US'
    }, {
      shortName: 'ST',
      value: 'Washington'
    }, {
      name: 'localityName',
      value: 'Seattle'
    }, {
      name: 'organizationName',
      value: 'Crank Local'
    }, {
      shortName: 'OU',
      value: orgUnit
    }]

    const csr = forge.pki.createCertificationRequest()
    csr.publicKey = pubKey
    csr.setSubject(attr)
    csr.sign(privKey)

    cert.validity.notBefore = new Date()
    cert.validity.notAfter = new Date()
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1)
    // If we're generating the CA cert, it should be self-signed/self-issued.
    if (!caPrivKey) {
      cert.publicKey = pubKey
      cert.setSubject(attr)
      cert.setIssuer(attr)
      cert.setExtensions([{
        name: 'basicConstraints',
        cA: true
      }])
      cert.sign(privKey)
    } else {
      // Otherwise, issue/sign as the CA.
      cert.serialNumber = '01'
      attr[5].value = 'CA'
      cert.publicKey = csr.publicKey
      cert.setSubject(attr)
      cert.setIssuer(attr)
      cert.sign(caPrivKey)
    }

    return forge.pki.certificateToPem(cert)
  }

}
