import React from 'react'
import City from './City.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/global.css'
import { Container } from 'reactstrap';

class App extends React.Component {
  render() {
    return (
      <Container>
        <City />
      </Container>
    )
  }
}

export default App
