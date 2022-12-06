import { Metaplex } from '@metaplex-foundation/js'
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js'
import { HYPERSPACE_URL } from '../constants'

import { NftData } from '../types'
import { getSolPrice } from './solana'
import { uploadImage } from './twitter'

const connection = new Connection(clusterApiUrl('mainnet-beta'))
const metaplex = new Metaplex(connection)

export async function getSalesTweet(
  name = 'An Ovol',
  amount: number,
  nftData: NftData
) {
  const salesTweet = [`${name} sold for ◎${amount}`]

  // Add the USD price if available
  const solPrice = await getSolPrice()
  if (solPrice) {
    salesTweet.push(`($${(amount * solPrice).toFixed(2)} USD)`)
  }

  // Add the marketplace
  if (nftData.source) {
    const marketplace = nftData.source
      .split('_')
      .map((w: string) => w[0].toUpperCase() + w.substring(1).toLowerCase())
      .join(' ')
    salesTweet.push(`on ${marketplace}`)
  }

  return salesTweet.join(' ')
}

export async function buildTweet(nftPublicKey: string, nftData: NftData) {
  const amount = nftData.amount / LAMPORTS_PER_SOL
  const mintAddress = new PublicKey(nftPublicKey)
  const nft = await metaplex?.nfts()?.findByMint({ mintAddress })
  const { image, name } = nft?.json ?? {}

  const tweet = ['Welcome to the City of Elixir! 🔮🦉\n\n']

  // Build the main tweet which shares sales data
  tweet.push(await getSalesTweet(name, amount, nftData))

  // Add the Hyperspace link
  tweet.push(`\n\n${HYPERSPACE_URL}/token/${nft.address}`)

  // Upload an image if found
  let mediaId
  if (image) {
    mediaId = await uploadImage(image)
  }

  return { tweet, mediaId }
}
