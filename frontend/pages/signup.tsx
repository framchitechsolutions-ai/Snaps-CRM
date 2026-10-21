import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/auth/signup',
      permanent: false,
    },
  }
}

export default function SignupRedirect() {
  return null
}
