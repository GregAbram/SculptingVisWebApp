// Functions accessible from JavaScript
extern crate base64;
extern crate wasm_bindgen;
extern crate wasm_logger;
#[macro_use]
extern crate log;

use wasm_bindgen::prelude::*;

pub mod image;
pub mod pixel;

use image::Image;
use pixel::Pixel;

const STRENGTH: f64 = 10.0;

#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
    wasm_logger::init_with_level(log::Level::Info).expect("Unable to initialize log");
    Ok(())
}

/// Normal map generator
/// Algorithm from: http://jon-martin.com/?p=123
#[wasm_bindgen]
pub fn normal_map(b64_image: String) -> String {
    let converted = Image::from(b64_image);
    let mut result = Image::new(converted.width, converted.height);
    for row in 0..result.height {
        for col in 0..result.width {
            let row_f = row as f64;
            let col_f = col as f64;
            let west =
                converted.get_pixel_mirrored(row_f, col_f - 1.0).luminance()
                    * STRENGTH;
            let east =
                converted.get_pixel_mirrored(row_f, col_f + 1.0).luminance()
                    * STRENGTH;
            let north =
                converted.get_pixel_mirrored(row_f - 1.0, col_f).luminance()
                    * STRENGTH;
            let south =
                converted.get_pixel_mirrored(row_f + 1.0, col_f).luminance()
                    * STRENGTH;

            let delta_col = ((east - west) + 1.0) * 0.5;
            let delta_row = ((south - north) + 1.0) * 0.5;

            result.set_pixel(
                row,
                col,
                Pixel::from_rgb(delta_col, delta_row, 1.0),
            );
        }
    }
    let s = String::from(result);
    s
}
