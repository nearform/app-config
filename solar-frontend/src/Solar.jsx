import React from 'react'
import { Form, FormGroup, Button, Table } from 'reactstrap'
const monthsArray = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

class CityForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      lat: props.lat,
      lng: props.lng,
      annual: 0,
      monthly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      isUSA: false,
      db: false
    }
    console.log(props)

    this.clear = this.clear.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleClear = this.handleClear.bind(this)
    this.solar = this.solar.bind(this)
  }

  async solar() {
    let uri = `http://localhost:3001/solar/${this.state.lat}/${this.state.lng}/${this.state.isUSA ? 'us' : 'intl'}`
    console.log(uri)
    fetch(uri)
      .then(res => res.json())
      .then(
        (result) => {
          if (result) {
            if (result.error) {
              this.clear()
            } else {
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
          }
        },
        (error) => {
          this.setState({
            isLoaded: true,
            error
          })
        }
      )
  }

  static getDerivedStateFromProps (props, state) {
    // Any time the current user changes,
    // Reset any parts of state that are tied to that user.
    // In this simple example, that's just the email.
    if (props.lat !== state.lat || props.lng !== state.lng) {
      return {
        lat: props.lat,
        lng: props.lng
      }
    }
    return null
  }

  clear () {
    this.setState({
      annual: 0,
      monthly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      db: false
    })
  }

  handleSubmit (event) {
    this.solar()
    event.preventDefault()
  }

  handleClear(event) {
    this.clear()
    event.preventDefault()
  }

  render() {
    return (
      <div>
        {this.state.lat && this.state.lng ? (
          <Form onSubmit={this.handleSubmit}>
            <FormGroup row>
              <Button color='primary' type='submit'>Fetch expected Solar output</Button>
            </FormGroup>
          </Form>
        ) : ''}
        {this.state.monthly[0] ? (
          <Table size='sm'>
            <thead>
              <tr>
                <th>Yearly</th>
                <th>{this.state.annual} kW</th>
              </tr>
            </thead>
            <tbody>
              {this.state.monthly.map((month, index) => (
                <tr>
                  <td>{monthsArray[index]}</td>
                  <td>{this.state.monthly[index]} kW</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : '' }
      </div>
    )
  }
}

export default CityForm

