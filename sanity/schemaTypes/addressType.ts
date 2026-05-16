import { HomeIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const addressType = defineType({
  name: "address",
  title: "Addresses",
  type: "document",
  icon: HomeIcon,
  fields: [
    defineField({
      name: "FirstName",
      title: "First Name",
      type: "string",
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: "lastName",
      title: "Last Name",
      type: "string",
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: "email",
      title: "User Email",
      type: "email",
    }),
    defineField({
      name: "phone",
      title: "Phone Number",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "operator",
      title: "Mobile Money Operator",
      type: "string",
      description: "Operator short code (from PayChangu API)",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "address",
      title: "Street Address",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "state",
      title: "State",
      type: "string",
    }),
    defineField({
      name: "zip",
      title: "ZIP Code",
      type: "string",
    }),
    defineField({
      name: "default",
      title: "Default Address",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
  name: "operatorRefId",
  title: "Operator Ref ID",
  type: "string",
  description: "PayChangu operator ref_id (used for mobile money payments)",
  readOnly: true, // optional: prevent manual edits in Studio
}),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    })
  ],


  preview: {
    select: {
      firstName: "firstName",
      lastName: "lastName",
      address: "address",
      city: "city",
      state: "state",
      isDefault: "default",
    },
    prepare({ firstName, lastName, address, city, state, isDefault }) {
      return {
        title: `${firstName} ${lastName} ${isDefault ? "(Default)" : ""}`,
        subtitle: `${address}, ${city}, ${state}`,
      }
    },
  },
})
