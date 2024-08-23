'use server'

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../database/mongoose"
import { handleError } from "../utils"
import User from "../database/models/user.model";
import Image from "../database/models/image.model";
import { redirect } from "next/navigation";


const populateUser = (query: any) => query.populate({
    path: "author",
    model: User, 
    select: "_id firstName lastName"
})


// For adding the Image
export async function addImage({ image, userId, path }: AddImageParams) {
    try {
        await connectToDatabase();

        const author = await User.findById(userId)  // getting the user from the database
        if (!author) {
            throw new Error("user not Found")
        }

        const newImage = await Image.create({      // creating the image in the database using the Image model 
            ...image,
            author: author._id
        })

        revalidatePath(path)

        return JSON.parse(JSON.stringify(newImage))

    } catch (error) {
        handleError(error)
    }
}

// For Updating the Image
export async function updateImage({ image, userId, path }: UpdateImageParams) {
    try {
        await connectToDatabase();

        const imageToUpdate = await Image.findById(image._id)
        if (!imageToUpdate || imageToUpdate.author.toHexString() !== userId) {
            throw new Error("Unauthorized or Image not found")
        }

        const updatedImage = await Image.findOneAndUpdate(
            imageToUpdate._id,
            image,
            { new: true }
        )

        revalidatePath(path)

        return JSON.parse(JSON.stringify(updatedImage))
    } catch (error) {
        handleError(error)
    }
}



// For Deleting the Image
export async function deleteImage(imageId: string) {
    try {
        await connectToDatabase();
        await Image.findByIdAndDelete(imageId)

    } catch (error) {
        handleError(error)
    } finally {
        redirect("/")
    }
}

// For getting the images
export async function getImageById(imageId: string) {
    try {
        await connectToDatabase();
        const image = populateUser(Image.findById(imageId))

        if(!image) throw new Error("Image not found")
        return JSON.parse(JSON.stringify(image))
    } catch (error) {
        handleError(error)
    }
}