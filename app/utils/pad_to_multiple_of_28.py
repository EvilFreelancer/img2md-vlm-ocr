from PIL import Image
import math


def pad_to_multiple_of_28(image: Image.Image) -> Image.Image:
    """
    Pads the input PIL image with a white background so that both dimensions are at least 28 pixels
    and are multiples of 28.
    """
    width, height = image.size
    new_width = max(28, math.ceil(width / 28) * 28)
    new_height = max(28, math.ceil(height / 28) * 28)

    if (width, height) == (new_width, new_height):
        return image

    # Create a new white image with the required size
    new_image = Image.new("RGB", (new_width, new_height), (255, 255, 255))
    # Paste the original image at the top-left corner
    new_image.paste(image, (0, 0))
    return new_image
