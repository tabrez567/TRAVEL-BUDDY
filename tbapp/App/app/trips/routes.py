from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import json
from extensions import db
from models import Trip, TripParticipant, Event, EventParticipant, User

trips_bp = Blueprint('trips', __name__)

@trips_bp.route('/')
@login_required
def my_trips():
    """Display user's trips"""
    user_trips = Trip.query.filter_by(user_id=current_user.id).order_by(Trip.created_at.desc()).all()
    participating_trips = db.session.query(Trip).join(TripParticipant).filter(
        TripParticipant.user_id == current_user.id,
        TripParticipant.status == 'accepted'
    ).all()
    
    return render_template('trips/my_trips.html', 
                         user_trips=user_trips, 
                         participating_trips=participating_trips)

@trips_bp.route('/create', methods=['GET', 'POST'])
@login_required
def create_trip():
    """Create a new trip"""
    if request.method == 'POST':
        try:
            trip = Trip(
                user_id=current_user.id,
                title=request.form['title'],
                description=request.form.get('description', ''),
                destination=request.form['destination'],
                start_date=datetime.strptime(request.form['start_date'], '%Y-%m-%d'),
                end_date=datetime.strptime(request.form['end_date'], '%Y-%m-%d'),
                budget=float(request.form.get('budget', 0)) if request.form.get('budget') else None,
                travel_style=request.form.get('travel_style'),
                group_size=int(request.form.get('group_size', 1)),
                is_public=request.form.get('is_public') == 'on'
            )
            
            db.session.add(trip)
            db.session.commit()
            
            # Add creator as organizer
            participant = TripParticipant(
                trip_id=trip.id,
                user_id=current_user.id,
                role='organizer',
                status='accepted'
            )
            db.session.add(participant)
            db.session.commit()
            
            flash('Trip created successfully!', 'success')
            return redirect(url_for('trips.trip_details', trip_id=trip.id))
            
        except Exception as e:
            flash(f'Error creating trip: {str(e)}', 'error')
            db.session.rollback()
    
    return render_template('trips/create_trip.html')

@trips_bp.route('/<int:trip_id>')
@login_required
def trip_details(trip_id):
    """View trip details"""
    trip = Trip.query.get_or_404(trip_id)
    
    # Check if user can view this trip
    if not trip.is_public and trip.user_id != current_user.id:
        # Check if user is a participant
        participant = TripParticipant.query.filter_by(
            trip_id=trip_id, 
            user_id=current_user.id
        ).first()
        if not participant:
            flash('You do not have permission to view this trip.', 'error')
            return redirect(url_for('trips.my_trips'))
    
    participants = TripParticipant.query.filter_by(trip_id=trip_id).all()
    events = Event.query.filter_by(trip_id=trip_id).order_by(Event.event_date).all()
    
    return render_template('trips/trip_details.html', 
                         trip=trip, 
                         participants=participants, 
                         events=events)

@trips_bp.route('/<int:trip_id>/join', methods=['POST'])
@login_required
def join_trip(trip_id):
    """Join a trip"""
    trip = Trip.query.get_or_404(trip_id)
    
    # Check if user is already a participant
    existing_participant = TripParticipant.query.filter_by(
        trip_id=trip_id, 
        user_id=current_user.id
    ).first()
    
    if existing_participant:
        flash('You are already a participant in this trip.', 'info')
        return redirect(url_for('trips.trip_details', trip_id=trip_id))
    
    # Check if trip has space
    if trip.group_size and len(trip.participants) >= trip.group_size:
        flash('This trip is full.', 'error')
        return redirect(url_for('trips.trip_details', trip_id=trip_id))
    
    participant = TripParticipant(
        trip_id=trip_id,
        user_id=current_user.id,
        role='participant',
        status='pending'
    )
    
    db.session.add(participant)
    db.session.commit()
    
    flash('Request to join trip sent!', 'success')
    return redirect(url_for('trips.trip_details', trip_id=trip_id))

@trips_bp.route('/<int:trip_id>/leave', methods=['POST'])
@login_required
def leave_trip(trip_id):
    """Leave a trip"""
    participant = TripParticipant.query.filter_by(
        trip_id=trip_id, 
        user_id=current_user.id
    ).first()
    
    if not participant:
        flash('You are not a participant in this trip.', 'error')
        return redirect(url_for('trips.my_trips'))
    
    if participant.role == 'organizer':
        flash('Organizers cannot leave their own trips.', 'error')
        return redirect(url_for('trips.trip_details', trip_id=trip_id))
    
    db.session.delete(participant)
    db.session.commit()
    
    flash('You have left the trip.', 'success')
    return redirect(url_for('trips.my_trips'))

@trips_bp.route('/<int:trip_id>/events/create', methods=['GET', 'POST'])
@login_required
def create_event(trip_id):
    """Create an event for a trip"""
    trip = Trip.query.get_or_404(trip_id)
    
    # Check if user is a participant
    participant = TripParticipant.query.filter_by(
        trip_id=trip_id, 
        user_id=current_user.id
    ).first()
    
    if not participant:
        flash('You must be a participant to create events for this trip.', 'error')
        return redirect(url_for('trips.trip_details', trip_id=trip_id))
    
    if request.method == 'POST':
        try:
            event = Event(
                organizer_id=current_user.id,
                trip_id=trip_id,
                title=request.form['title'],
                description=request.form.get('description', ''),
                location=request.form['location'],
                latitude=float(request.form.get('latitude')) if request.form.get('latitude') else None,
                longitude=float(request.form.get('longitude')) if request.form.get('longitude') else None,
                event_date=datetime.strptime(request.form['event_date'], '%Y-%m-%dT%H:%M'),
                duration_hours=float(request.form.get('duration_hours', 2)),
                max_participants=int(request.form.get('max_participants')) if request.form.get('max_participants') else None,
                cost_per_person=float(request.form.get('cost_per_person', 0)),
                event_type=request.form.get('event_type', 'activity'),
                is_public=request.form.get('is_public') == 'on'
            )
            
            db.session.add(event)
            db.session.commit()
            
            flash('Event created successfully!', 'success')
            return redirect(url_for('trips.trip_details', trip_id=trip_id))
            
        except Exception as e:
            flash(f'Error creating event: {str(e)}', 'error')
            db.session.rollback()
    
    return render_template('trips/create_event.html', trip=trip)

@trips_bp.route('/events/<int:event_id>/join', methods=['POST'])
@login_required
def join_event(event_id):
    """Join an event"""
    event = Event.query.get_or_404(event_id)
    
    # Check if user is already a participant
    existing_participant = EventParticipant.query.filter_by(
        event_id=event_id, 
        user_id=current_user.id
    ).first()
    
    if existing_participant:
        flash('You are already a participant in this event.', 'info')
        return redirect(url_for('trips.trip_details', trip_id=event.trip_id))
    
    # Check if event has space
    if event.max_participants and len(event.participants) >= event.max_participants:
        flash('This event is full.', 'error')
        return redirect(url_for('trips.trip_details', trip_id=event.trip_id))
    
    participant = EventParticipant(
        event_id=event_id,
        user_id=current_user.id,
        status='confirmed'
    )
    
    db.session.add(participant)
    db.session.commit()
    
    flash('You have joined the event!', 'success')
    return redirect(url_for('trips.trip_details', trip_id=event.trip_id))

@trips_bp.route('/search')
@login_required
def search_trips():
    """Search for public trips"""
    query = request.args.get('q', '')
    destination = request.args.get('destination', '')
    start_date = request.args.get('start_date', '')
    travel_style = request.args.get('travel_style', '')
    
    trips_query = Trip.query.filter_by(is_public=True)
    
    if query:
        trips_query = trips_query.filter(
            Trip.title.contains(query) | Trip.description.contains(query)
        )
    
    if destination:
        trips_query = trips_query.filter(Trip.destination.contains(destination))
    
    if start_date:
        try:
            date_obj = datetime.strptime(start_date, '%Y-%m-%d')
            trips_query = trips_query.filter(Trip.start_date >= date_obj)
        except ValueError:
            pass
    
    if travel_style:
        trips_query = trips_query.filter(Trip.travel_style == travel_style)
    
    trips = trips_query.order_by(Trip.start_date.asc()).all()
    
    return render_template('trips/search_trips.html', 
                         trips=trips, 
                         query=query,
                         destination=destination,
                         start_date=start_date,
                         travel_style=travel_style)
