import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';

function getStoredToken(): string | null {
  try { return sessionStorage.getItem('cdm_token'); } catch { return null; }
}

const authLink = new ApolloLink((operation, forward) => {
  const token = getStoredToken();
  if (token) {
    operation.setContext({
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  return forward(operation);
});

const httpLink = new HttpLink({ uri: '/graphql' });

export const apolloClient = new ApolloClient({
  link:  ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache(),
});
