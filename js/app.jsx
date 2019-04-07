/*jshint quotmark:false */
/*jshint white:false */
/*jshint trailing:false */
/*jshint newcap:false */
/*global React, Router*/
var app = app || {};

(function () {
	'use strict';

	app.ALL_TODOS = 'all';
	app.ACTIVE_TODOS = 'active';
	app.COMPLETED_TODOS = 'completed';
	var TodoFooter = app.TodoFooter;
	var TodoItem = app.TodoItem;

	var ENTER_KEY = 13;

	var TodoApp = React.createClass({
		getInitialState: function () {
			return {
				nowShowing: app.ALL_TODOS,
				editing: null,
				newTodo: '',
				todos: []
			};
		},

		componentDidMount: function () {
			fetch('http://localhost:3000/api/tasks').then((resp) => resp.json()).then((body) => {this.setState({todos:body})});

			var setState = this.setState;
			
			var router = Router({
				'/': setState.bind(this, {nowShowing: app.ALL_TODOS}),
				'/active': setState.bind(this, {nowShowing: app.ACTIVE_TODOS}),
				'/completed': setState.bind(this, {nowShowing: app.COMPLETED_TODOS})
			});
			router.init('/');
		},

		handleChange: function (event) {
			this.setState({newTodo: event.target.value});
		},

		handleNewTodoKeyDown: function (event) {
			if (event.keyCode !== ENTER_KEY) {
				return;
			}

			event.preventDefault();

			var val = this.state.newTodo.trim();

			if (val) {
				var task = {
					title: val,
					completed: false
				};

				fetch('http://localhost:3000/api/tasks', {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(task)
				}).then((resp) => resp.json()).then(
				setTimeout(()=>fetch('http://localhost:3000/api/tasks')
					.then((resp) => resp.json()).then((body) => {this.setState({todos:body})}),500));

				this.setState({newTodo: ''});
			}

		},

		toggleAll: function (event) {
			var checked = event.target.checked;
			var ids = [];

			var todos = this.state.todos;
			var i;
			for(i = 0; i < todos.length; i++) {
				if(todos[i].completed != checked) ids.push(todos[i]._id);
			};


			var payload = {
				ids: ids,
				editable: {
					completed: checked
				}
			};

			fetch('http://localhost:3000/api/tasks/', {
				method: 'PUT',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload)
			}).then((resp) => resp.json()).then(
				setTimeout(()=>fetch('http://localhost:3000/api/tasks')
					.then((resp) => resp.json()).then((body) => {this.setState({todos:body})}),500));

			
		},

		toggle: function (todoToToggle) {
			todoToToggle.completed = !todoToToggle.completed

			fetch('http://localhost:3000/api/tasks/' + todoToToggle._id, {
				method: 'PUT',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(todoToToggle)
			}).then((resp) => resp.json()).then(
				setTimeout(()=>fetch('http://localhost:3000/api/tasks')
					.then((resp) => resp.json()).then((body) => {this.setState({todos:body})}),500));
			
		},

		destroy: function (todo) {
			fetch('http://localhost:3000/api/tasks/' + todo._id, {
				method: 'DELETE',
			}).then(
				setTimeout(()=>fetch('http://localhost:3000/api/tasks')
					.then((resp) => resp.json()).then((body) => {this.setState({todos:body})}),500));
		},

		edit: function (todo) {
			this.setState({editing: todo._id});
		},

		save: function (todoToSave, text) {
			// this.props.model.save(todoToSave, text);
			var edit = todoToSave;
			edit.title = text;

			fetch('http://localhost:3000/api/tasks/' + todoToSave._id, {
				method: 'PUT',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(edit)
			}).then((resp) => resp.json()).then(
				setTimeout(()=>fetch('http://localhost:3000/api/tasks')
					.then((resp) => resp.json()).then((body) => {this.setState({todos:body})}),500));
			

			this.setState({editing: null});
		},

		cancel: function () {
			this.setState({editing: null});
		},

		clearCompleted: function () {
			var ids = [];
			var todos = this.state.todos;
			var i;
			for(i=0; i<todos.length; i++){
				if(todos[i].completed) ids.push(todos[i]._id);
			};
			fetch('http://localhost:3000/api/tasks/', {
				method: 'DELETE',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(ids)
			}).then((resp) => resp.json()).then(
				setTimeout(()=>fetch('http://localhost:3000/api/tasks')
					.then((resp) => resp.json()).then((body) => {this.setState({todos:body})}),500));
		},

		render: function () {
			var footer;
			var main;
			var todos = this.state.todos;

			var shownTodos = todos.filter(function (todo) {
				switch (this.state.nowShowing) {
				case app.ACTIVE_TODOS:
					return !todo.completed;
				case app.COMPLETED_TODOS:
					return todo.completed;
				default:
					return true;
				}
			}, this);

			var todoItems = shownTodos.map(function (todo) {
				return (
					<TodoItem
						key={todo.id}
						todo={todo}
						onToggle={this.toggle.bind(this, todo)}
						onDestroy={this.destroy.bind(this, todo)}
						onEdit={this.edit.bind(this, todo)}
						editing={this.state.editing === todo._id}
						onSave={this.save.bind(this, todo)}
						onCancel={this.cancel}
					/>
				);
			}, this);

			var activeTodoCount = todos.reduce(function (accum, todo) {
				return todo.completed ? accum : accum + 1;
			}, 0);

			var completedCount = todos.length - activeTodoCount;

			if (activeTodoCount || completedCount) {
				footer =
					<TodoFooter
						count={activeTodoCount}
						completedCount={completedCount}
						nowShowing={this.state.nowShowing}
						onClearCompleted={this.clearCompleted}
					/>;
			}

			if (todos.length) {
				main = (
					<section className="main">
						<input
							id="toggle-all"
							className="toggle-all"
							type="checkbox"
							onChange={this.toggleAll}
							checked={activeTodoCount === 0}
						/>
						<label
							htmlFor="toggle-all"
						/>
						<ul className="todo-list">
							{todoItems}
						</ul>
					</section>
				);
			}

			return (
				<div>
					<header className="header">
						<h1>todos</h1>
						<input
							className="new-todo"
							placeholder="What needs to be done?"
							value={this.state.newTodo}
							onKeyDown={this.handleNewTodoKeyDown}
							onChange={this.handleChange}
							autoFocus={true}
						/>
					</header>
					{main}
					{footer}
				</div>
			);
		}
	});

	// var model = new app.TodoModel('react-todos');

	function render() {
		React.render(
			<TodoApp />,
			document.getElementsByClassName('todoapp')[0]
		);
	}

	// model.subscribe(render);
	render();
})();
