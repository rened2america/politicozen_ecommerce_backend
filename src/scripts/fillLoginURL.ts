// Use the import if you have "type": "module" in package.json
// Otherwise, use require statements as needed
import { PrismaClient } from '@prisma/client'
import authService from '../modules/auth/authService';

const prisma = new PrismaClient()

async function fillLoginURLS(forOneArtist = false, artistID = 0) {
  try {
    if (forOneArtist && (!artistID || artistID == 0)) {
      console.log("artistID not found")
      return;
    }
    
    // Fetch Artists
    let artists = []
    if (forOneArtist) {
      console.log(`Filling loginTokens and loginUrls for artistID: ${artistID}...`)
      artists = await prisma.artist.findMany({
        where: {
          id: artistID
        }
      })
    } else {
      console.log("Filling loginTokens and loginUrls for all artists...")
      artists = await prisma.artist.findMany()
    }

    // For each Artist, generate token + URL and update
    const updates = artists.map(async (artist) => {
      const token = authService.secureRandomHex(16) // 32-char hex
      const url = `https://app.politicozen.com/${token}/login`

      return prisma.artist.update({
        where: { id: artist.id },
        data: {
          loginToken: token,
          loginUrl: url,
        },
      })
    })

    // 3. Run all updates in parallel
    await Promise.all(updates)
    console.log('All artists updated with login_token and login_url!')
  } catch (error) {
    console.error('Error filling login tokens:', error)
    process.exit(1)
  } finally {
    // 4. Cleanly exit the Prisma Client
    await prisma.$disconnect()
  }
}

// Run the script
fillLoginURLS()