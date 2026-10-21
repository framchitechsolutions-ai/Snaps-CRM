import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/auth/login',
      permanent: false,
    },
  }
}

export default function LoginRedirect() {
  return null
}
