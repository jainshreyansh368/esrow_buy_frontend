import { sendTxUsingExternalSignature } from './externalwallet';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { connection } from "./connection";
import {
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";

import {
  ESCROW_ACCOUNT_DATA_LAYOUT,
} from "./utils";

const BN = require("bn.js");

export const cancel = async (user) => {

  const escrowStateAccountPubkey = new PublicKey("GjLM26ewDd5R4YwcedVz1v99tfdYzJ79BhKEJeyMCuQQ");
  const escrowProgramId = new PublicKey("8JzCQkvyH1VK7i1WbYGhvSLUjfwJdvs5Txpc7C1FVgPB");

  const escrowAccount = await connection.getAccountInfo(
    escrowStateAccountPubkey
  );

  if (escrowAccount === null) {
    console.log("Could not find escrow at given address!");
    //process.exit(1);
  }
  console.log(escrowAccount, "*****escrow Account ..");

  const encodedEscrowState = escrowAccount && escrowAccount.data;
  const decodedEscrowLayout = ESCROW_ACCOUNT_DATA_LAYOUT.decode(
    encodedEscrowState
  );
  const mint = new PublicKey(decodedEscrowLayout.mintKey);
  console.log(mint.toBase58(), "****decode layout****")

  const escrowState = {
    escrowAccountPubkey: escrowStateAccountPubkey,
    isInitialized: !!decodedEscrowLayout.isInitialized,
    initializerAccountPubkey: new PublicKey(
      decodedEscrowLayout.sellerPubkey
    ),
    TokenAccountPubkey: new PublicKey(
      decodedEscrowLayout.tokenAccountPubkey
    ),
    TokenMint: new PublicKey(
      decodedEscrowLayout.mintKey
    ),
    expectedAmount: new BN(decodedEscrowLayout.expectedAmount, 10, "le"),
  };


  const PDA = (await PublicKey.findProgramAddress(
      [
        Buffer.from('escrow'),
        escrowStateAccountPubkey.toBuffer(),
      ],
      escrowProgramId,
    ))[0];


  const cancelInstruction = new TransactionInstruction({
    programId: escrowProgramId,
    data: Buffer.from(
      Uint8Array.of(2)
    ),
    keys: [
      { pubkey: user, isSigner: true, isWritable: false },
      {
        pubkey: escrowState.TokenAccountPubkey,
        isSigner: false,
        isWritable: true,
      },
      { pubkey: escrowStateAccountPubkey, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: PDA, isSigner: false, isWritable: false },
    ]

  });

  console.log("Sending transaction for cancel ...");
  await sendTxUsingExternalSignature(
    [cancelInstruction],
    connection,
    null,
    [],
    new PublicKey(user)
  );

  console.log("✨ listing canceled succesfully..........✨✨\n");

}