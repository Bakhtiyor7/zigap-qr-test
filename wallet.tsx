import CryptoService from "./cryptoService.tsx";
import { io } from "socket.io-client";

class Wallet {
  private privateKey: string;
  public publicKey: string;
  private socket: any;
  private roomId: string;
  private walletAddress: string;
  private dappPublicKey: string;
  private signMessage: string;

  constructor(walletAddress: string) {
    const { privateKey, publicKey } = CryptoService.generateKeys();
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.walletAddress = walletAddress;
    this.socket = null;
    this.roomId = "";
    this.dappPublicKey = "";
    this.signMessage = "";
  }

  public connectToServer(
    serverUrl: string,
    roomId: string,
    dappPublicKey: string
  ) {
    this.roomId = roomId;
    this.dappPublicKey = dappPublicKey;
    this.socket = io(serverUrl);

    // connect to room
    this.socket.on("connect", () => {
      console.log("Connected to Socket.io server");
      this.socket.emit("joinRoom", roomId);
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from Socket.io server");
    });

    // sign the message, send sign and public key to the dapp
    this.socket.on("messageToSign", (message: string) => {
      const signature = CryptoService.sign(message, this.privateKey);
      this.socket.emit("signedMessage", this.roomId, {
        signature,
        publicKey: this.publicKey,
      });
    });

    // confirm the verification, send the wallet address if true
    this.socket.on("verifySignature", (isValid: boolean) => {
      if (isValid) {
        this.sendWalletAddress();
      }
    });
  }

  public signPendingMessage() {
    if (this.signMessage) {
      const signature = CryptoService.sign(this.signMessage, this.privateKey);
      this.socket.emit("signedMessage", this.roomId, {
        signature,
        publicKey: this.publicKey,
      });
      this.signMessage = "";
    } else {
      console.log("No message to sign");
    }
  }

  public sendWalletAddress() {
    this.socket.emit("walletAddress", this.roomId, {
      address: this.walletAddress,
    });
    console.log("Sent wallet address to dapp:", this.walletAddress);
  }
}

export default Wallet;
