import React from 'react'
import Geonames from 'geonames.js'
import Solar from './Solar.jsx'
import { Alert, Row, Col, Form, FormGroup, Button, ButtonGroup, Table } from 'reactstrap'

const geonames = new Geonames({ username: 'jopie', lan: 'en', encoding: 'JSON' })

class CityForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      value: '',
      lat: '',
      lng: '',
      isUSA: false,
      city: '',
      error: null
    }
  }

 latlng =  async (city) => {
    console.log(`getting lat/lng for ${city}`)
    try {
      let resp = await geonames.search({ q: city })
      if (resp.totalResultsCount > 0) {
        let data = resp.geonames[0]
        console.log(data)
        this.setState({
          city: data.name,
          lat: data.lat,
          lng: data.lng,
          isUSA: data.countryCode === 'US' || false,
          error: null
        })
      } else {
        this.setState({
          error: `No coordinates found for ${city}`,
          city: '',
          value: '',
          lat: '',
          lng: ''
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value })
  }

  handleSubmit = (event) => {
    this.latlng(this.state.value)
    event.preventDefault()
  }

  handleClear = (event) => {
    this.setState({
      value: '',
      city: '',
      lat: '',
      lng: '',
      isUSA: false,
      error: null
    })
    event.preventDefault()
  }


  render () {
    return (
      <Row>
        <Col>
          <div>
            <Form onSubmit={this.handleSubmit}>
              <FormGroup row>
                <label>
                  <h1>In which city is your house?</h1>
                  <input type='text' value={this.state.value} onChange={this.handleChange} />
                </label>
                <ButtonGroup>
                  <Button color='primary' type='submit'>Fetch lat/lon</Button>
                  <Button color='secondary' onClick={this.handleClear} type='button'>clear</Button>
                </ButtonGroup>
              </FormGroup>
            </Form>
            {this.state.error &&
              <Alert color='danger'>
                {this.state.error}
              </Alert>
            }
            {this.state.city &&
              <Table size='sm'>
                <tbody>
                  <tr>
                    <td>Name</td>
                    <td>{this.state.city}</td>
                  </tr>
                  <tr>
                    <td>Latitude</td>
                    <td>{this.state.lat}</td>
                  </tr>
                  <tr>
                    <td>Longitude</td>
                    <td>{this.state.lng}</td>
                  </tr>
                </tbody>
              </Table>
            }
          </div>
        </Col>
        <Col>
          <Solar key={this.state.city} lat={this.state.lat} lng={this.state.lng} isUSA={this.state.isUSA} />
        </Col>
      </Row>
    )
  }
}

export default CityForm
