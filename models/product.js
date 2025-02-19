const mongoose = require("mongoose");
const { text } = require("pdfkit");
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0.01, // Example: Minimum price allowed
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: [
      {
        type: String,
        required: true,
      },
    ],
    category: {
      type: String,
      enum: [
        "Electronics",
        "Fashion and Apparel",
        "Beauty and Personal Care",
        "Home and Kitchen",
        "Health and Wellness",
        "Books and Media",
        "Toys and Games",
        "Sports and Outdoors",
        "Automotive",
        "Groceries and Gourmet Food",
        "Pet Supplies",
        "Office Supplies",
        "Baby Products",
        "Handmade and Artisan Products",
        "Industrial and Scientific",
      ],
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
      enum: [
        "Mobile Phones and Accessories",
        "Laptops and Computers",
        "Cameras and Photography Equipment",
        "Audio Devices (Headphones, Speakers)",
        "Home Appliances (TVs, Refrigerators, Washing Machines)",
        "Men's Clothing",
        "Women's Clothing",
        "Kids' Clothing",
        "Footwear",
        "Accessories (Bags, Jewelry, Watches)",
        "Skincare Products",
        "Haircare Products",
        "Makeup",
        "Fragrances",
        "Grooming Tools",
        "Furniture",
        "Home Decor",
        "Kitchen Appliances",
        "Cookware and Tableware",
        "Bedding and Bath",
        "Supplements",
        "Fitness Equipment",
        "Medical Supplies",
        "Personal Care Products",
        "Books (Fiction, Non-Fiction, Academic)",
        "Magazines",
        "Music CDs and Vinyl Records",
        "Movies and TV Shows (DVDs, Blu-rays)",
        "Children's Toys",
        "Board Games",
        "Video Games and Consoles",
        "Educational Toys",
        "Sports Equipment",
        "Outdoor Gear",
        "Camping and Hiking Supplies",
        "Fitness Accessories",
        "Car Accessories",
        "Motorcycle Accessories",
        "Automotive Tools and Equipment",
        "Fresh Produce",
        "Packaged Foods",
        "Beverages",
        "Organic and Specialty Foods",
        "Pet Food",
        "Pet Accessories",
        "Pet Health Products",
        "Office Furniture",
        "Stationery",
        "Printers and Scanners",
        "Office Electronics",
        "Baby Clothing",
        "Baby Care Products",
        "Baby Gear (Strollers, Car Seats)",
        "Toys and Educational Products",
        "Handmade Jewelry",
        "Art and Craft Supplies",
        "Custom-made Gifts",
        "Lab Equipment",
        "Industrial Tools",
        "Safety Equipment",
      ],
    },
    subSubCategory: {
      type: String,
    },
    colour: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1, // Example: Minimum quantity allowed
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        text: String,
        created: {
          type: Date,
          default: Date.now,
        },
        postedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        name: { type:String, ref: "User" },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
