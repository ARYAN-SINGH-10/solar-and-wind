"""
Report Generation Service
Deterministic report assembly – no AI/ML.
Aggregates site analysis data from DB and structures a JSON report payload.
Generates actual PDF and Excel binaries using ReportLab and OpenPyXL.
"""

from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.report import Report
from app.models.site import Site
from app.models.project import Project
from app.models.environmental_data import EnvironmentalData
from app.models.solar_assessment import SolarAssessment
from app.models.wind_assessment import WindAssessment
from app.models.site_suitability import SiteSuitability
from app.models.site_score import SiteScore
from app.models.energy_forecast import EnergyForecast
from app.models.recommendation import Recommendation
from app.models.deployment_optimization import DeploymentOptimization
from app.services.pdf_excel_generator import generate_pdf_report, generate_excel_report


REPORT_TYPES = {
    "SITE_ASSESSMENT": "Site Assessment Report",
    "SOLAR_POTENTIAL": "Solar Potential Report",
    "WIND_POTENTIAL": "Wind Potential Report",
    "FEASIBILITY": "Feasibility Report",
    "INVESTMENT": "Investment Report",
    "SITE_SUITABILITY": "Site Suitability Assessment Report",
    "SOLAR_ANALYSIS": "Solar PV Yield Analysis Report",
    "WIND_ANALYSIS": "Wind Resource Assessment Report",
    "ENERGY_FORECAST": "Energy Generation & Revenue Forecast Report",
    "FULL_FEASIBILITY": "Full Feasibility & Investment Recommendation Report",
    "GIS_EXPORT": "GIS Geographic Data Layer Export",
}


def _to_float(val):
    try:
        return float(val) if val is not None else None
    except (TypeError, ValueError):
        return None


def _serialize(obj):
    """Recursively convert non-serializable types."""
    if obj is None:
        return None
    if isinstance(obj, (str, int, float, bool)):
        return obj
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, UUID):
        return str(obj)
    if hasattr(obj, "isoformat"):  # date objects
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_serialize(i) for i in obj]
    if hasattr(obj, "__dict__"):
        return {
            k: _serialize(v)
            for k, v in obj.__dict__.items()
            if not k.startswith("_")
        }
    return str(obj)


def generate_site_report(
    db: Session,
    site_id: str,
    report_type: str,
    generated_by_id: str,
) -> Report:
    """
    Assemble a structured JSON report for the given site and persist it.
    All data sourced deterministically from the existing DB records.
    """
    import uuid
    sid = uuid.UUID(str(site_id)) if isinstance(site_id, str) else site_id

    site = db.query(Site).filter(Site.id == sid).first()
    if not site:
        raise ValueError(f"Site {site_id} not found")

    project = db.query(Project).filter(Project.id == site.project_id).first() if site.project_id else None

    title = f"{REPORT_TYPES.get(report_type, report_type)} – {site.site_name}"
    description = (
        f"Auto-generated {report_type} report for site '{site.site_name}' "
        f"on {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}"
    )

    # --- Collect data blocks from DB ---
    env = (
        db.query(EnvironmentalData)
        .filter(EnvironmentalData.site_id == sid)
        .order_by(EnvironmentalData.created_at.desc())
        .first()
    
    )
    if not env:
        raise ValueError("Cannot generate report: Required environmental data does not exist for this site.")
    solar = (
        db.query(SolarAssessment)
        .filter(SolarAssessment.site_id == sid)
        .order_by(SolarAssessment.created_at.desc())
        .first()
    )
    wind = (
        db.query(WindAssessment)
        .filter(WindAssessment.site_id == sid)
        .order_by(WindAssessment.created_at.desc())
        .first()
    )
    suitability = (
        db.query(SiteSuitability)
        .filter(SiteSuitability.site_id == sid)
        .order_by(SiteSuitability.created_at.desc())
        .first()
    )
    score = (
        db.query(SiteScore)
        .filter(SiteScore.site_id == sid)
        .order_by(SiteScore.calculated_at.desc())
        .first()
    )
    forecasts = (
        db.query(EnergyForecast)
        .filter(EnergyForecast.site_id == sid)
        .order_by(EnergyForecast.created_at.desc())
        .limit(12)
        .all()
    )
    recommendation = (
        db.query(Recommendation)
        .filter(Recommendation.site_id == sid)
        .order_by(Recommendation.created_at.desc())
        .first()
    )
    optimization = (
        db.query(DeploymentOptimization)
        .filter(DeploymentOptimization.site_id == sid)
        .order_by(DeploymentOptimization.created_at.desc())
        .first()
    )

    report_data = {
        "report_meta": {
            "report_type": report_type,
            "title": title,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "generated_by": str(generated_by_id),
            "platform": "Solar & Wind Deployment Intelligence Platform",
            "methodology": "Deterministic Engineering Calculations (No AI/ML)",
        },
        "project_info": {
            "id": str(project.id) if project else None,
            "project_name": project.project_name if project else "Standalone Candidate Site",
            "project_code": project.project_code if project else "NONE",
            "region": project.region if project else site.region,
            "status": project.status if project else "ACTIVE",
        },
        "site_info": {
            "id": str(site.id),
            "site_name": site.site_name,
            "latitude": _to_float(site.latitude),
            "longitude": _to_float(site.longitude),
            "region": site.region,
            "land_area": _to_float(site.land_area),
            "elevation": _to_float(site.elevation),
            "land_ownership": site.land_ownership,
        },
        "environmental_data": _serialize(env),
        "solar_assessment": _serialize(solar),
        "wind_assessment": _serialize(wind),
        "site_suitability": _serialize(suitability),
        "site_score": _serialize(score),
        "energy_forecasts": [_serialize(f) for f in forecasts],
        "recommendation": _serialize(recommendation),
        "deployment_optimization": _serialize(optimization),
        "summary": _build_summary(score, recommendation, solar, wind),
    }

    pid = site.project_id if (site.project_id is None or isinstance(site.project_id, uuid.UUID)) else uuid.UUID(str(site.project_id))
    gid = uuid.UUID(str(generated_by_id)) if isinstance(generated_by_id, str) else generated_by_id

    report = Report(
        site_id=sid,
        project_id=pid,
        generated_by=gid,
        report_type=report_type,
        title=title,
        description=description,
        report_data=report_data,
        status="GENERATED",
    )
    db.add(report)
    site.status = "REPORT_GENERATED"
    db.commit()
    db.refresh(report)
    return report



def _build_summary(score, recommendation, solar, wind) -> dict:
    return {
        "overall_score": _to_float(score.overall_score) if score else None,
        "suitability_category": score.category if score else None,
        "recommended_technology": recommendation.technology if recommendation else None,
        "estimated_investment_usd": _to_float(recommendation.investment_estimate) if recommendation else None,
        "estimated_annual_revenue_usd": _to_float(recommendation.expected_revenue) if recommendation else None,
        "solar_annual_energy_kwh": _to_float(solar.expected_energy_output) if solar else None,
        "wind_annual_energy_kwh": _to_float(wind.expected_annual_energy_production) if wind else None,
    }


def generate_report_binary(report: Report, fmt: str = "pdf") -> tuple[bytes, str, str]:
    """
    Generates actual binary content for PDF or Excel exports.
    Returns (bytes, filename, media_type).
    """
    report_title = report.title or f"{report.report_type} Report"
    report_data = report.report_data or {}
    clean_type = report.report_type.lower().replace(" ", "_")

    if fmt.lower() in ["excel", "xlsx"]:
        content = generate_excel_report(report_title, report_data)
        filename = f"{clean_type}_{str(report.id)[:8]}.xlsx"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        content = generate_pdf_report(report_title, report_data)
        filename = f"{clean_type}_{str(report.id)[:8]}.pdf"
        media_type = "application/pdf"

    return content, filename, media_type


def get_site_reports(db: Session, site_id: str):
    import uuid
    sid = uuid.UUID(str(site_id)) if isinstance(site_id, str) else site_id
    return (
        db.query(Report)
        .filter(Report.site_id == sid)
        .order_by(Report.generated_at.desc())
        .all()
    )


def get_project_reports(db: Session, project_id: str):
    import uuid
    pid = uuid.UUID(str(project_id)) if isinstance(project_id, str) else project_id
    return (
        db.query(Report)
        .filter(Report.project_id == pid)
        .order_by(Report.generated_at.desc())
        .all()
    )


def get_all_reports(db: Session, limit: int = 50, offset: int = 0):
    return (
        db.query(Report)
        .order_by(Report.generated_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
