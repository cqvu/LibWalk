/* eslint-disable */
import React from "react";
import "../../css/subs.css";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import { changeClub, changeEvent, getClub, getEvent } from "../cloud";
import { MdEdit } from "react-icons/md";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import db from "../../firebase";

/**
 * Defines a component for displaying an event.
 */
class EachEvent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        event: {
			clubHosting: "",
            eventName: "",
            location: "",
            date: "",
            time: {},
            pictureURL: "",
            description: "",
            rsvpForm: "",
            eventReference: this.props.eventId
        },
        showEventDetail: false,
        editEvent: false,
        renderEvent: true
    };

    this.redirectToEventDetail = this.redirectToEventDetail.bind(this);
    this.handleEditEvent = this.handleEditEvent.bind(this);
    this.handleSubmitEdit = this.handleSubmitEdit.bind(this);
    this.deleteEvent = this.deleteEvent.bind(this);
	this.fixTime = this.fixTime.bind(this);
	this.timePrefill = this.timePrefill.bind(this);
	this.convertTime = this.convertTime.bind(this);
  }

    // noinspection JSCheckFunctionSignatures
    async componentDidMount() {
        console.log(this.props.eventId);
        await getEvent(this.props.eventId).then(json => {
            if (json === undefined) {
                //alert("Firebase usage exceeded, refresh page in a minute.");
                return;

            }
            this.setState({
                event: {
					clubHosting: json["clubHosting"],
                    eventName: json["eventName"],
                    description: json["description"],
                    pictureURL: json["pictureURL"],
                    location: json["location"],
                    rsvpForm: json["rsvpForm"],
                    time: json["time"]/*new Date(json["time"]["seconds"]*1000)*/,
                    date: json["date"],
                    eventReference: json['eventReference'],
                    clubHosting: json["clubHosting"]
                }
            });
        });
    }

  /**
   * Changes the view to the even details page.
   */
  redirectToEventDetail() {
    this.props.history.push({
      pathname: "/events",
      state: {
        event_id: this.state.event.eventReference
      }
    });
  }

  /**
   * Sets the state to show the event details.
   */
  showEventDetail = () => {
    this.setState({ showEventDetail: true });
  };

  /**
   * Handler to set the state after an event is edited.
   */
  handleEditEvent = () => {
    this.setState({ editEvent: true });
  };

  /**
   * Deletes an event from the database.
   *
   * @returns {Promise<void>}
   */
  async deleteEvent() {
    console.log("delete event");
    await db
      .firestore()
      .collection("Events")
      .doc(this.state.event.eventReference)
      .delete();
    this.setState({
      renderEvent: false
    });
    await getClub(this.props.clubId).then(json => {
      const org = json;
      console.log(org);
      const newEventList = [...org["eventList"]];
      const index = newEventList.indexOf(this.state.event.eventReference);
      if (index > -1) {
        newEventList.splice(index, 1);
      }
      org["eventList"] = newEventList;
      console.log(org["eventList"]);
      changeClub(this.props.clubId, org);
    });
  }

  /**
   * Closes all forms on the page.
   */
  closeModals = () => {
    this.setState({
      showEventDetail: false,
      editEvent: false
    });
  };


    /**
     * Handles what happens when you change a clubs event details
     *
     */
    async handleSubmitEdit(e) {
        e.preventDefault();
        console.log("edit event")
		let date = new Date(e.target[2].value + "T" + e.target[3].value + ":00");
		var firebase = require('firebase');
		let timeStamp = new firebase.firestore.Timestamp.fromDate(date);
        await this.setState({
            event: {
                ...this.state.event,
                eventName: e.target[0].value,
                location: e.target[1].value,
                date: e.target[2].value,
                time: timeStamp,
                pictureURL: e.target[4].value,
                description: e.target[5].value,
                rsvpForm: e.target[6].value
            }
        });
        await changeEvent(this.state.event.eventReference, this.state.event);
		console.log(this.state.event.time)
        this.closeModals();
    }

	fixTime = (min, hour) => {
		if(min < 10) {
			min = "0" + min;
		}
		if(hour === 0) {
			return "12:" + min + "am";
		}
		else if(hour === 12) {
			return hour + ":" + min + "pm";
		}
		else if(hour > 12) {
			hour = hour - 12;
			return hour + ":" + min + "pm";
		}
		else {
			return hour + ":" + min + "am";
		}
	}

	timePrefill = (min, hour) => {
		if(min < 10) {
			min = "0" + min;
		}
		if(hour < 10) {
			hour = "0" + hour;
		}
		return hour + ":" + min;
	}

	convertTime = () => {
		this.setState({
			event: {
					...this.state.event,
					time: new Date(this.state.event.time['seconds']*1000)
				}
		});
	}

  render() {
	console.log(this.state.event.time);
    if(this.state.renderEvent) {
        return (
        <div>
            <Card className="text-center" style={{ width: "18rem" }}>
            <Card.Header>
                {this.props.admin ? (
                <a
                    onClick={this.handleEditEvent}
                    style={{ fontSize: "15px", float: "right", margin: "0" }}
                >
                    <MdEdit />
                </a>
                ) : null}
                <Card.Title style={{ fontSize: "30px" }}>
                <a onClick={this.showEventDetail}>{this.state.event.eventName}</a>
                </Card.Title>
            </Card.Header>
            <Card.Body>
                <Card.Subtitle
                className="mb-2 text-muted"
                style={{ fontSize: "15px", textAlign: "justify-center" }}
                >
                📍 {this.state.event.location} <br />
                📅 {new Date(this.state.event.time['seconds']*1000).toDateString()} <br />
                🕔 {this.fixTime(new Date(this.state.event.time['seconds']*1000).getMinutes(), new Date(this.state.event.time['seconds']*1000).getHours())}
                </Card.Subtitle>
                <Card.Text>
                {this.state.event.description.slice(0, 100) + "..."}
                </Card.Text>
            </Card.Body>
            <Card.Footer>
                {this.props.admin ? (
                <Button variant="danger" block onClick={this.deleteEvent}>
                    Delete Event
                </Button>
                ) : null}
            </Card.Footer>
            </Card>
            
            {/* Event Detail Modal */}
            <Modal
            size="lg"
            show={this.state.showEventDetail}
            onHide={this.closeModals}
            aria-labelledby="example-modal-sizes-title-lg"
            >
            <Modal.Header closeButton></Modal.Header>
            <Modal.Body>
                <Card border="light">
                <Card.Img variant="top" src={this.state.event.pictureURL} />
                <Card.Body>
                    <Card.Title style={{ fontSize: "2rem", textAlign: "center" }}>
                    <strong>{this.state.event.eventName}</strong>
                    </Card.Title>
                    <Card.Subtitle
                    className="mb-2 text-muted"
                    style={{
                        display: "flex",
                        justifyContent: "space-around",
                        alignItems: "center",
                        fontSize: "25px"
                    }}
                    >
                    📍 {this.state.event.location} &nbsp;&nbsp; 📅{" "}
                    {new Date(this.state.event.time['seconds']*1000).toDateString()} &nbsp;&nbsp; 🕔 {this.fixTime(new Date(this.state.event.time['seconds']*1000).getMinutes(), new Date(this.state.event.time['seconds']*1000).getHours())}
                    </Card.Subtitle>
                    <Card.Text style={{ textAlign: "justify" }}>
                    {this.state.event.description}
                    </Card.Text>
                    <div style={{ textAlign: "center" }}>
                    <a href={this.state.event.rsvpForm}>
                        <Button variant="primary" block>
                        RSVP
                        </Button>
                    </a>
                    </div>
                </Card.Body>
                </Card>
            </Modal.Body>
            </Modal>
                    {/* Edit Event Modal */}
                    <Modal
                    size="lg"
                    show={this.state.editEvent}
                    onHide={this.closeModals}
                    aria-labelledby="example-modal-sizes-title-lg"
                    >
                        <Modal.Header closeButton>
                            <Modal.Title id="example-modal-sizes-title-lg">
                                Edit Event
                            </Modal.Title>
                        </Modal.Header>
            <Modal.Body>
              <Form onSubmit={this.handleSubmitEdit}>
                <Form.Group controlId="formName">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter Event Name"
                    defaultValue={this.state.event.eventName}
                  />
                </Form.Group>

                <Form.Group controlId="formPlace">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter Event Location"
                    defaultValue={this.state.event.location}
                  />
                </Form.Group>
                <Form.Group controlId="formTime">
                    <Form.Label>Date</Form.Label>
                    <Form.Control type="date" defaultValue={this.state.event.date}/>
                </Form.Group>
				<Form.Group controlId="formTime">
					<Form.Label>Time (12-hr format) </Form.Label>
					<Form.Control type="time" defaultValue={this.timePrefill(new Date(this.state.event.time['seconds']*1000).getMinutes(), new Date(this.state.event.time['seconds']*1000).getHours())}/>
				</Form.Group>
                <Form.Group controlId="formPic">
                    <Form.Label>Picture URL</Form.Label>
                    <Form.Control type="url" placeholder="Enter Event Picture URL"
                                    defaultValue={this.state.event.pictureURL}/>
                </Form.Group>
                <Form.Group controlId="formDetails">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter Event Descriptions"
                    defaultValue={this.state.event.description}
                  />
                </Form.Group>

                <Form.Group controlId="formRSVP">
                  <Form.Label>
                    RSVP (Google Form, TypeForm, SurveyMonkey, others...)
                  </Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="Enter RSVP URL"
                    defaultValue={this.state.event.rsvpForm}
                  />
                </Form.Group>
                <Button variant="primary" type="submit">
                  Submit
                </Button>
              </Form>
            </Modal.Body>
          </Modal>
        </div>
      );
    } else {
      return <div></div>;
    }
  }
}

export default EachEvent;
