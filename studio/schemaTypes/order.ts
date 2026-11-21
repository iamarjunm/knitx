import {defineArrayMember, defineField, defineType} from 'sanity'
import {PackageIcon} from '@sanity/icons'

export const order = defineType({
  name: 'order',
  title: 'Order',
  type: 'document',
  icon: PackageIcon,
  groups: [
    {name: 'summary', title: 'Order & Fulfillment', default: true},
    {name: 'customer', title: 'Customer & Shipping'},
    {name: 'payment', title: 'Razorpay Payment'},
  ],
  fields: [
    defineField({
      name: 'orderNumber',
      title: 'Order Number',
      type: 'string',
      group: 'summary',
      description: 'Unique KNITX order reference, e.g. "KX-ORD-001042".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'firebaseUid',
      title: 'Firebase UID',
      type: 'string',
      group: 'customer',
    }),
    defineField({
      name: 'customerName',
      title: 'Customer Name',
      type: 'string',
      group: 'customer',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'customerEmail',
      title: 'Customer Email',
      type: 'string',
      group: 'customer',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'customerPhone',
      title: 'Customer Phone (India +91)',
      type: 'string',
      group: 'customer',
    }),
    defineField({
      name: 'shippingAddress',
      title: 'Shipping Address',
      type: 'text',
      rows: 3,
      group: 'customer',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'items',
      title: 'Ordered Pieces',
      type: 'array',
      group: 'summary',
      validation: (Rule) => Rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'orderItem',
          title: 'Order Item',
          fields: [
            defineField({
              name: 'productId',
              title: 'Product Document ID',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'title',
              title: 'Piece Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'serialCode',
              title: 'Serial Code',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'tier',
              title: 'Scarcity Tier',
              type: 'string',
              options: {
                list: [
                  {title: 'Small-Batch', value: 'small-batch'},
                  {title: 'One-of-One', value: 'one-of-one'},
                ],
              },
            }),
            defineField({
              name: 'size',
              title: 'Size',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'quantity',
              title: 'Quantity',
              type: 'number',
              initialValue: 1,
              validation: (Rule) => Rule.required().integer().positive(),
            }),
            defineField({
              name: 'priceInr',
              title: 'Unit Price (INR ₹)',
              type: 'number',
              validation: (Rule) => Rule.required().integer().positive(),
            }),
          ],
          preview: {
            select: {
              title: 'title',
              serialCode: 'serialCode',
              size: 'size',
              quantity: 'quantity',
              priceInr: 'priceInr',
            },
            prepare({title, serialCode, size, quantity, priceInr}) {
              const priceLabel =
                typeof priceInr === 'number' ? `₹${priceInr.toLocaleString('en-IN')}` : '₹—'
              return {
                title: `${serialCode ?? 'KX'} — ${title ?? 'Piece'}`,
                subtitle: `Size ${size ?? '?'} × ${quantity ?? 1} • ${priceLabel}`,
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'totalAmountInr',
      title: 'Total Amount (INR ₹)',
      type: 'number',
      group: 'summary',
      validation: (Rule) => Rule.required().integer().positive(),
    }),
    defineField({
      name: 'razorpayOrderId',
      title: 'Razorpay Order ID',
      type: 'string',
      group: 'payment',
    }),
    defineField({
      name: 'razorpayPaymentId',
      title: 'Razorpay Payment ID',
      type: 'string',
      group: 'payment',
    }),
    defineField({
      name: 'paymentStatus',
      title: 'Payment Status',
      type: 'string',
      group: 'payment',
      initialValue: 'pending',
      options: {
        list: [
          {title: 'Pending', value: 'pending'},
          {title: 'Paid (Razorpay Verified)', value: 'paid'},
          {title: 'Demo Paid (Sandbox Test)', value: 'demo_paid'},
          {title: 'Failed', value: 'failed'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'productionStage',
      title: 'Sample-First Production Stage',
      type: 'string',
      group: 'summary',
      initialValue: 'sample_confirmed',
      options: {
        list: [
          {title: '01 // Sample Confirmed', value: 'sample_confirmed'},
          {title: '02 // Cutting Heavyweight Fabric', value: 'cutting_fabric'},
          {title: '03 // Embroidery & Handcraft', value: 'embroidery_craft'},
          {title: '04 // Quality Check & Edition Numbering', value: 'quality_numbered'},
          {title: '05 // Dispatched (Insured Courier)', value: 'dispatched'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'createdAt',
      title: 'Order Created At',
      type: 'datetime',
      group: 'summary',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
  ],
  orderings: [
    {
      title: 'Newest Orders',
      name: 'createdAtDesc',
      by: [{field: 'createdAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      orderNumber: 'orderNumber',
      customerName: 'customerName',
      totalAmountInr: 'totalAmountInr',
      paymentStatus: 'paymentStatus',
      productionStage: 'productionStage',
    },
    prepare({orderNumber, customerName, totalAmountInr, paymentStatus, productionStage}) {
      const amount =
        typeof totalAmountInr === 'number' ? `₹${totalAmountInr.toLocaleString('en-IN')}` : '₹—'
      const payment = paymentStatus ? paymentStatus.toUpperCase() : 'PENDING'
      const stage = productionStage ? productionStage.replace(/_/g, ' ').toUpperCase() : ''
      return {
        title: `${orderNumber ?? 'KX-ORD'} — ${customerName ?? 'Collector'}`,
        subtitle: `${amount} • ${payment} • ${stage}`,
      }
    },
  },
})
