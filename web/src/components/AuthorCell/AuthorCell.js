import Author from 'src/components/Author'

export const QUERY = gql`
  query FindAuthorQuery($id: Int!) {
    author: user(id: $id) {
      email
      fullName
    }
  }
`

export const Loading = () => <span>Loading...</span>

export const Empty = () => <span>Empty</span>

export const Failure = ({ error }) => (
  <span style={{ color: 'red' }}>Error: {error?.message}</span>
)

export const Success = ({ author }) => (
  <span className="author-cell">
    <Author author={author} />
  </span>
)
