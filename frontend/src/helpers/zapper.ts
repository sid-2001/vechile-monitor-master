
// const BASE_URL: string = 'http://164.90.252.179:9091/'; // UAT

import axios from 'axios';



const getUID = async () => {
  try {
    console.warn('getUniqueID_api_called');

    const response = await axios.get('https://api.impronics.com/api/transactions/generate-zapper-uuid');

    console.log('getUniqueID response----', response);

    // Check if the response has status true and data contains uuid
    if (response.data.status) {
      return response.data.data.uuid;
    } else {
      throw new Error('Invalid response status');
    }
  } catch (error) {
    console.error('Error fetching unique ID:', error);
    return null; // You can return null or an appropriate error message if needed
  }
};


const getUniqueID = async () => {
  try {
    console.warn('getUniqueID_api_called');

    const response = await axios.get(await getUID());

    console.log('getUniqueID response----', response);

    if (response.status === 200) {
      return response.data.uuid;
    }
  } catch (error) {
    console.error('Error fetching unique ID:', error);
    return error;
  }
};


export const generateZapperSessionIdApi = async () => {
    try {
   
      const merchantOrderId = await await getUID();

      const payload = {
        merchantOrderId: merchantOrderId,
        amount: '1000',
        currencyISOCode: 'ZAR',
        notificationUrl:
          'https://merchantstore.com/somePaymentNotificationPath',
        returnUrl: 'https://merchantstore.com/someReturnPath',
        cancelUrl: 'https://merchantstore.com/someCancelPath',
        requestId: 'ad7234d5-4e6b-4acf-8e29-451c056b2bdc',
        origin: 'https://merchantstore.com',
        customFields: [
          {
            key: 'FieldLabel',
            value: 'FieldValue',
          },
        ],
      };

      console.log('zapper_Payload:--------', payload);

      const headers = {
        merchantId: '69482',
        merchantSiteId: '88108',
        'x-api-key': '2386a2059c484119b01c446f60b8bf62',
        'Content-Type': 'application/json',
        Authorization: 'Bearer 2386a2059c484119b01c446f60b8bf62',
      };

      const response = await axios.post(
        'https://gateway.zapper.com/api/v3.1/sessions',
        payload,
        {headers},
      );

      console.warn('zapper_Response----', response.data);
      if (response.data.status == 'Success') {
        
      }
    } catch (error) {
    
    }
  };

//     const createTransactionOutwardApi = async paymentStatus => {
//     try {
//       setErrorText(null);
//       setLoading(true);
//       console.warn('CREATE_TRANSACTION_API_CALLED');

//       const {beneficiary} = transaction;

//       if (!transaction?.darftedTransactionNumber) {
//         console.error('TRANSACTION ID NOT FOUND');
//         setErrorText({
//           title: 'Transaction Error',
//           message: 'Transaction Id not found',
//         });
//         return;
//       }

//       const body = {
//         vatCharges: transaction?.vatCharges,
//         rewardPoints: transaction?.refferalAmount
//           ? transaction?.refferalAmount
//           : '0',
//         bopId: transaction.bopCategory.id,
//         transactionId: transaction?.darftedTransactionNumber
//           ? transaction?.darftedTransactionNumber
//           : '',
//         gatewayStatus: paymentStatus ? 'Success' : 'Failed',
//         fcmToken: user?.fcmToken,
//         gatewayId: selectedGateway?.id,
//         benificary: {
//           benificaryId: beneficiary?.beneficiaryId,
//           accountHolderName: beneficiary?.beneficiaryName,
//           accountNumber: beneficiary?.accountNumber,
//           bank: beneficiary?.bankName,
//           ifscCode: beneficiary?.ifscCode,
//         },

//         transferMethod: 'Bank Transfer',
//         destinationCountry:
//           transaction?.receiverCountry?.countryName == 'India' ? 'IN' : 'ZA',
//         sourceCountry:
//           transaction?.senderCountry?.countryName == 'India' ? 'IN' : 'ZA',
//         selectedTimeMethod: {
//           id: 1,
//           time: '2 hours',
//           charges: transaction?.charges,
//           total: 200,
//         },
//         gateway: {
//           id: 1,
//           name: 'PayPal',
//           avatarUrl:
//             'https://upload.wikimedia.org/wikipedia/commons/a/a0/Paypal.svg',
//         },
//         amount: transaction?.amountSend?.toString(),
//         applicant: {
//           applicantId: user?.applicantId,
//           name: user?.firstName + ' ' + user?.lastName,
//           accountNumber: beneficiary?.accountNumber,
//           profilePhoto: 'https://randomuser.me/api/portraits/men/1.jpg',
//         },
//         forex: transaction?.conversionCharges,
//         timecharge: '2 hours',
//         sourceCurrency:
//           transaction?.receiverCountry?.countryName == 'India' ? 'INR' : 'ZAR',
//         destinationCurrency:
//           transaction?.senderCountry?.countryName == 'India' ? 'INR' : 'ZAR',
//         totalpaybleamount: transaction?.amountReceive?.toString(),
//       };

//       console.log('transaction_body--------', JSON.stringify(body));

//       const response = await ApiRequest({
//         endPoint: ApiList.transactionOutwardCreate,
//         method: 'post',
//         query: JSON.stringify(body),
//       });

//       if (response.status) {
//         const transactionId = response.data;

//         const data = {
//           ...transaction,
//           transactionId: transactionId,
//         };

//         dispatch(saveTransaction(data));

//         showToast('s', response.message);
//         if (paymentStatus) {
//           setLoading(false);
//           props.navigation.navigate('TransactionSuccess');
//         }
//       } else {
//         setLoading(false);
//         console.error(
//           'Error transactionOutwardDraft Api 1111:',
//           response.message,
//         );
//         setErrorText({
//           title: 'Transaction Error',
//           message: response.message,
//         });
//         showToast('e', response.message);
//       }
//     } catch (error) {
//       setLoading(false);
//       console.error('Error transactionOutwardDraft Api 2222:', error);
//       setErrorText({
//         title: 'Transaction Error',
//         message: error.message,
//       });
//       showToast('e', error.message);
//     }
//   };