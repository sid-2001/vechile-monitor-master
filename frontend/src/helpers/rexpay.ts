
//@ts-ignore
class RexPay {
  constructor() {
    //@ts-ignore
    this.apiUrl = "https://pgs.globalaccelerex.com/api/";//@ts-ignore
    this.testUrl = "https://pgs-sandbox.globalaccelerex.com/api/";//@ts-ignore
  }

  async initializePayment(
    //@ts-ignore
    body) {
    //@ts-ignore
    return this._sendRequest("pgs/payment/v2/createPayment", body);
  }

  async verifyPayment(
    //@ts-ignore
    body) {
    return this._sendRequest("cps/v1/getTransactionStatus", body);
  }

  _sendRequest(
    //@ts-ignore
    endpoint, body) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.onload = function () {
        const res = JSON.parse(xhr.responseText);

        // Success scenarios
        if (xhr.status >= 200 && xhr.status < 300) {
          if (res.status === "CREATED" || res.responseCode === "00") {
            return resolve({
              success: true,
              message: res.status,
              data: {
                authorizeUrl: res.paymentUrl || "",
                reference: res.paymentUrlReference || res.paymentReference
              }
            });
          }

          return reject({
            success: false,
            message: res.responseMessage || res.responseDescription
          });
        }

        // Error scenarios
        if (xhr.status === 400 || xhr.status === 500) {
          return reject({
            success: false,
            message: res.responseMessage
          });
        }
      };

      xhr.onerror = function () {
        reject({
          success: false,
          message: "Service Unavailable. Please try again later"
        });
      };

      const url = body?.mode === "Live"

        ?
        //@ts-ignore
        this.apiUrl + endpoint

        :

        //@ts-ignore
         this.testUrl + endpoint;

      xhr.open("POST", url);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader(
        "Authorization",
        "Basic " + btoa(
          "talk2phasahsyyahoocom:f0bedbea93df09264a4f09a6b38de6e9b924b6cb92bf4a0c07ce46f26f85"
        )
      );

      xhr.send(JSON.stringify(body));
    });
  }
}



export default RexPay;
