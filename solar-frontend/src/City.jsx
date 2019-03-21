import React from 'react'
import Geonames from 'geonames.js'
import Solar from './Solar.jsx'
import { Row, Col, Form, FormGroup, Button, ButtonGroup, Table } from 'reactstrap'

const geonames = new Geonames({ username: 'jopie', lan: 'en', encoding: 'JSON' })

class CityForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      value: '',
      lat: '',
      lng: '',
      isUSA: false,
      city: ''
    }

    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleClear = this.handleClear.bind(this)
    this.latlng = this.latlng.bind(this)
  }

  async latlng(city) {
    console.log(`getting lat/lng for ${city}`)
    try {
      let resp = await geonames.search({ q: city })
      let data = resp.geonames[0]
      console.log(data)
      this.setState({
        city: data.name,
        lat: data.lat,
        lng: data.lng,
        isUSA: data.countryCode === 'US' || false
      })
    } catch (err) {
      console.error(err)
    }
  }

  handleChange(event) {
    this.setState({ value: event.target.value })
  }

  handleSubmit(event) {
    this.latlng(this.state.value)
    event.preventDefault()
  }

  handleClear(event) {
    this.setState({
      city: '',
      lat: '',
      lng: '',
      isUSA: false
    })
    event.preventDefault()
  }


  render() {
    return (
      <Row>
        <Col>
          <div>
            <Form onSubmit={this.handleSubmit}>
              <FormGroup row>
                <label>
                  <h1>Where do you live?</h1>
                  <input type='text' value={this.state.value} onChange={this.handleChange} />
                </label>
                <ButtonGroup>
                  <Button color='primary' type='submit'>Fetch lat/lon</Button>
                  <Button color='secondary' onClick={this.handleClear} type='button'>clear</Button>
                </ButtonGroup>
              </FormGroup>
            </Form>
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
