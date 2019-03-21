import React from 'react'
import { Row, Col, Form, FormGroup, Button, ButtonGroup, Table } from 'reactstrap'

class CityForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      lat: props.lat,
      lng: props.lng,
      annual: 0,
      monthly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      db: false
    }
    console.log(props)

    this.clear = this.clear.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleClear = this.handleClear.bind(this)
    this.solar = this.solar.bind(this)
  }

  async solar() {
    let uri = `http://localhost:3001/solar/${this.state.lat}/${this.state.lng}`
    console.log(uri)
    fetch(uri)
      .then(res => res.json())
      .then(
        (result) => {
          if (result) {
            let monthlyFixed = []
            if (result.monthly_kw) {
              for (let i = 0; i < result.monthly_kw.length; i++) {
                monthlyFixed.push(result.monthly_kw[i].toFixed(2))
              }
            } else {
              monthlyFixed = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            }
            this.setState({
              annual: result.annual_kw ? result.annual_kw.toFixed(2) : 0,
              monthly: monthlyFixed
            })
          }
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isLoaded: true,
            error
          })
        }
      )
  }

  componentWillReceiveProps({ lat, lng }) {
    this.setState({ ...this.state, lat, lng })
    this.clear()
  }

  clear() {
    this.setState({
      annual: 0,
      monthly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      db: false
    })
  }

  handleSubmit(event) {
    this.solar()
    event.preventDefault()
  }

  handleClear(event) {
    this.clear()
    event.preventDefault()
  }

  render() {
    if (this.state.lat && this.state.lng) {
      return (
        <div>
          <Form onSubmit={this.handleSubmit}>
            <FormGroup row>
              <Button color='primary' type='submit'>Fetch expected Solar output</Button>
            </FormGroup>
          </Form>
          <Table size='sm'>
            <thead>
              <tr>
                <th>Yearly</th>
                <th>{this.state.annual} kW</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>January</td>
                <td>{this.state.monthly[0]} kW</td>
              </tr>
              <tr>
                <td>February</td>
                <td>{this.state.monthly[1]} kW</td>
              </tr>
              <tr>
                <td>March</td>
                <td>{this.state.monthly[2]} kW</td>
              </tr>
              <tr>
                <td>April</td>
                <td>{this.state.monthly[3]} kW</td>
              </tr>
              <tr>
                <td>May</td>
                <td>{this.state.monthly[4]} kW</td>
              </tr>
              <tr>
                <td>June</td>
                <td>{this.state.monthly[5]} kW</td>
              </tr>
              <tr>
                <td>July</td>
                <td>{this.state.monthly[6]} kW</td>
              </tr>
              <tr>
                <td>August</td>
                <td>{this.state.monthly[7]} kW</td>
              </tr>
              <tr>
                <td>September</td>
                <td>{this.state.monthly[8]} kW</td>
              </tr>
              <tr>
                <td>October</td>
                <td>{this.state.monthly[9]} kW</td>
              </tr>
              <tr>
                <td>November</td>
                <td>{this.state.monthly[10]} kW</td>
              </tr>
              <tr>
                <td>December</td>
                <td>{this.state.monthly[11]} kW</td>
              </tr>
            </tbody>
          </Table>
        </div>
      )
    } else {
      return (
        <div />
      )
    }
  }
}

export default CityForm

