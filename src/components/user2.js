//user 2 --> NFT owner
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { connection } from "./connection";
import {
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";

import { ESCROW_ACCOUNT_DATA_LAYOUT } from "./utils";
import { sendTxUsingExternalSignature } from './externalwallet';
import { fetchMetadata } from "./fetchmetdatafrommint";
const BN = require("bn.js");

export const user2 = async (user) => {
  console.log(user, "chceck user");

  const systemProgramId = new PublicKey("11111111111111111111111111111111")

  const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")


  const escrowStateAccountPubkey = new PublicKey("9C2LYLUHugMLWE8wNhwCWDKddE1cbp1WztMbKd5hLQyR");
  const escrowProgramId = new PublicKey("8JzCQkvyH1VK7i1WbYGhvSLUjfwJdvs5Txpc7C1FVgPB")

  //fetch data
  const escrowAccount = await connection.getAccountInfo(
    escrowStateAccountPubkey
  );

  if (escrowAccount === null) {
    console.log("Could not find escrow at given address!");
    //process.exit(1);
  }
  //console.log(escrowAccount, "*****escrow Account ..");

  const encodedEscrowState = escrowAccount && escrowAccount.data;
  const decodedEscrowLayout = ESCROW_ACCOUNT_DATA_LAYOUT.decode(
    encodedEscrowState
  );
  const mint = new PublicKey(decodedEscrowLayout.mintKey);
  console.log(mint.toBase58(), "****Mint key****")

  const escrowState = {
    escrowAccountPubkey: escrowStateAccountPubkey,
    isInitialized: !!decodedEscrowLayout.isInitialized,
    initializerAccountPubkey: new PublicKey(
      decodedEscrowLayout.sellerPubkey
    ),
    XTokenTempAccountPubkey: new PublicKey(
      decodedEscrowLayout.tokenAccountPubkey
    ),
    TokenMintKey: new PublicKey(
      decodedEscrowLayout.mintKey
    ),
    expectedAmount: new BN(decodedEscrowLayout.expectedAmount, 10, "le"),
  };


  //metadata pda account
  const metadataAccount = (
    await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      METADATA_PROGRAM_ID,
    )
  )[0];

  const PDA = (await PublicKey.findProgramAddress(
    [
      Buffer.from('escrow'),
      escrowStateAccountPubkey.toBuffer(),
    ],
    escrowProgramId,
  ))[0];

  //fetch creators

  const nftMetadata = await fetchMetadata(mint);
  console.log(nftMetadata.length > 0 && nftMetadata[0] && nftMetadata[0].data && nftMetadata[0].data.creators.length > 0 && nftMetadata[0].data.creators, "nft metadata from mint ");
  const addressArray = nftMetadata.length > 0 && nftMetadata[0] && nftMetadata[0].data && nftMetadata[0].data.creators.length > 0 && nftMetadata[0].data.creators.map(e => ({ address: e.address }))
  console.log("addressArray", addressArray)


  const keystest = [
    { pubkey: user, isSigner: true, isWritable: false },
    {
      pubkey: escrowState.XTokenTempAccountPubkey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: escrowState.initializerAccountPubkey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: escrowState.TokenMintKey,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: escrowStateAccountPubkey, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: systemProgramId, isSigner: false, isWritable: false },
    { pubkey: PDA, isSigner: false, isWritable: false },
    { pubkey: metadataAccount, isSigner: false, isWritable: false },

  ]

  const newArr = [
    ...keystest, ...addressArray.map(e => ({ pubkey: new PublicKey(e.address), isSigner: false, isWritable: true })
    )
  ];

  console.log(newArr);

  // sending transaction
  const exchangeInstruction = new TransactionInstruction({
    programId: escrowProgramId,
    data: Buffer.from(
      Uint8Array.of(1, ...new BN(1).toArray("le", 8))
    ),
    keys: newArr,
  });

  console.log("Sending Buyer's transaction...");
  await sendTxUsingExternalSignature(
    [exchangeInstruction],
    connection,
    null,
    [],
    user,
  );

  // sleep to allow time to update
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(
    "✨Trade successfully executed. All temporary accounts closed✨\n"
  );
}
