//! Represents a collection of pixels (an image)
// Original by Wagner Correa, 1999
// Turned to C++ by Robert Osada, 2000
// Updateded by Stephen J. Guy, 2017
// Translated to Rust by Bridger Herman, 2018

use std::io::{BufReader, BufWriter};

use base64;
use png::HasParameters;

use crate::pixel::{Pixel, RawPixel};

/// A struct representing a collection of pixels
#[derive(Debug, Clone)]
pub struct Image {
    pixels: Vec<RawPixel>,

    pub width: usize,
    pub height: usize,
}

impl Image {
    pub fn new(width: usize, height: usize) -> Self {
        Self {
            pixels: vec![RawPixel::default(); width * height],
            width,
            height,
        }
    }

    pub fn from_bytes(bytes: &[u8], info: png::OutputInfo) -> Self {
        let step = match info.color_type {
            png::ColorType::RGB => 3,
            png::ColorType::RGBA => 4,
            _ => {
                error!("Unsupported image color");
                panic!("Unsupported image color");
            }
        };

        let mut raw_pixels =
            vec![RawPixel::default(); (info.width * info.height) as usize];
        for (raw_index, byte_index) in
            (0..bytes.len()).step_by(step).enumerate()
        {
            if step == 3 {
                raw_pixels[raw_index] = RawPixel {
                    r: bytes[byte_index],
                    g: bytes[byte_index + 1],
                    b: bytes[byte_index + 2],
                    a: u8::max_value(),
                };
            } else if step == 4 {
                raw_pixels[raw_index] = RawPixel {
                    r: bytes[byte_index],
                    g: bytes[byte_index + 1],
                    b: bytes[byte_index + 2],
                    a: bytes[byte_index + 3],
                };
            }
        }

        Self {
            pixels: raw_pixels,

            width: info.width as usize,
            height: info.height as usize,
        }
    }

    /// Add a background to an image (overwrites image)
    pub fn with_background(mut self, color: Pixel) -> Image {
        self.pixels = vec![RawPixel::from(color); self.pixels.len()];
        self
    }

    /// Check to see if a coordinate is valid and inside an image
    pub fn is_valid_coord(&self, row: usize, col: usize) -> bool {
        col < self.width && row < self.height
    }

    pub fn get_pixel(&self, row: usize, col: usize) -> Option<Pixel> {
        if !self.is_valid_coord(row, col) {
            return None;
        }
        Some(Pixel::from(self.pixels[row * self.width + col]))
    }

    pub fn get_pixel_mirrored(&self, row: f64, col: f64) -> Pixel {
        let (mut row, mut col) = (row.abs(), col.abs());

        // Reflect the image if it's over boundaries on the high-indexed
        // side
        if row >= self.height as f64 {
            row = self.height as f64 - (row - self.height as f64) - 1.0;
        }
        if col >= self.width as f64 {
            col = self.width as f64 - (col - self.width as f64) - 1.0;
        }

        let (row, col) =
            (row.abs().round() as usize, col.abs().round() as usize);

        Pixel::from(self.pixels[row * self.width + col])
    }

    pub fn get_pixels(&self) -> Vec<Pixel> {
        self.pixels.iter().map(|&raw| Pixel::from(raw)).collect()
    }

    pub fn set_pixel(&mut self, row: usize, col: usize, pix: Pixel) {
        if !self.is_valid_coord(row, col) {
            return;
        }
        self.pixels[row * self.width + col] = RawPixel::from(pix)
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        self.pixels.iter().map(Vec::<u8>::from).flatten().collect()
    }

    fn to_png_bytes(&self) -> Vec<u8> {
        let file = Vec::new();
        let mut w = BufWriter::new(file);

        {
            let mut encoder = png::Encoder::new(
                &mut w,
                self.width as u32,
                self.height as u32,
            );
            encoder.set(png::ColorType::RGBA).set(png::BitDepth::Eight);

            let mut writer = encoder
                .write_header()
                .expect("Unable to write image header");

            let raw_bytes = self.to_bytes();
            writer
                .write_image_data(&raw_bytes)
                .expect("Unable to write image");
        }

        w.into_inner().expect("Unable to get png byte vector")
    }
}

/// Convert a png-formatted base64 String into an Image
impl From<String> for Image {
    fn from(b64: String) -> Image {
        // Strip off the leading "data:image/png;base64,"
        let no_header = &b64[22..];
        // Convert the string into something that's `read`able
        let file_bytes =
            base64::decode(no_header).expect("Unable to decode base64");
        let r = BufReader::new(&file_bytes[..]);

        // Decode the png bytes
        let decoder = png::Decoder::new(r);
        let (info, mut reader) =
            decoder.read_info().expect("Unable to read png info");
        let mut buf = vec![0; info.buffer_size()];
        reader
            .next_frame(&mut buf)
            .expect("Unable to read png image");

        Image::from_bytes(&buf, info)
    }
}

// Convert an Image back to a png-formatted base64 String
impl From<Image> for String {
    fn from(img: Image) -> String {
        let bytes = img.to_png_bytes();
        format!("data:image/png;base64,{}", base64::encode(&bytes))
    }
}
