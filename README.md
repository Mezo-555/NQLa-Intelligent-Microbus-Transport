# ⚖️ Interactive Multi-Agent Courtroom Simulation System

An AI-powered, interactive multi-agent courtroom simulator designed for law students to practice legal reasoning and advocacy within the Egyptian legal system. Developed as a senior graduation project by students in the Intelligent Systems track at Alexandria National University.

## 📖 Overview

Legal education traditionally relies on moot court exercises and role-play to train students, which are effective but highly resource-intensive and difficult to scale. This system provides a repeatable, low-stakes environment where students can actively participate in simulated trial stages.

The platform models the core participants of a trial—a judge, prosecution, defense, and a witness—as distinct autonomous AI agents that interact with each other and the student in real time. A major technical focus of the project is solving a regional NLP challenge: managing the linguistic shift between formal legal Arabic (الفصحى القانونية) for attorneys and judges, and colloquial Egyptian Arabic for lay witnesses.

## ✨ Key Features

* **Multi-Agent Orchestration:** Utilizes a state-machine framework (such as LangGraph or CrewAI) to strictly manage procedural turn-taking based on the current stage of the simulated proceeding.
* **Active Student Participation:** Students do not just observe; they interact live through a dedicated interface, making real decisions like framing questions or raising objections directly to the AI agents.
* **Egyptian Legal RAG:** Agents are grounded in real Egyptian procedural law (e.g., the Criminal/Civil Procedure Code) via a Retrieval-Augmented Generation (RAG) vector database to prevent legal hallucinations.
* **Dual-Register Arabic NLP:** Agents dynamically switch between formal legal Arabic and Egyptian colloquial dialects based on their role-specific system prompts.
* **Participate-Feedback-Retry Cycle:** An independent evaluator agent analyzes student inputs for procedural permissibility and legal soundness, providing structured feedback and allowing the student to replay the scenario.

## 🏗 System Architecture

* **Orchestration Layer:** A controlling process that manages the turn-taking logic and routes interactions between agents and the human user.
* **Knowledge Layer (RAG):** A vector database indexing Egyptian legal codes alongside a small set of synthetic case scenarios (3-5 initially) drafted with a legal domain consultant to ensure procedural accuracy.
* **AI/NLP Layer:** General-purpose LLMs configured with strict system prompts that encode each agent's responsibilities, permitted actions, and procedural constraints.
* **Frontend:** A user interface for live trial interaction and reviewing performance analytics.

## 👥 Team

* **Institution:** Alexandria National University - Department of Computer Science
* **Team Size:** 8 members

This project is structured across four core engineering microservices: Orchestration Logic, Legal NLP & Personas, Data & RAG Knowledge, and Full-Stack Infrastructure.

## ⚠️ Ethical Considerations & Disclaimer

This system is an educational simulation tool intended exclusively to support law students' understanding of courtroom procedure. It is not a legal advice tool and is not a substitute for the judgment of a licensed legal professional.
