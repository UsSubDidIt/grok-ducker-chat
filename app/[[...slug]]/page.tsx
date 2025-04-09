import { ClientOnly } from './client'

// With static export removed, we only need to pre-render the home page
// Other routes will be generated on-demand
export function generateStaticParams() {
  return [
    { slug: [''] }
  ]
}

export default function Page() {
  return <ClientOnly />
}
