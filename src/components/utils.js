import * as BufferLayout from "buffer-layout";


       const publicKey = (property = "publicKey") => {
        return BufferLayout.blob(32, property);
      }
 const uint64 = (property = "uint64") => {
  return BufferLayout.blob(8, property);
};  

export const ESCROW_ACCOUNT_DATA_LAYOUT = BufferLayout.struct([

    BufferLayout.u8("isInitialized"),
    publicKey("sellerPubkey"),
    publicKey("tokenAccountPubkey"),
    publicKey("mintKey"),
    uint64("expectedAmount"),
  ]);
  