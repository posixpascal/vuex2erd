import { Model } from './model';

export class UML {
  private source = ``;
  private header = `
skinparam dpi 300
!define Table(name,desc) class name as "desc" << (T,#DDAAAA) >>
!define primary_key(x) <b>x</b>
!define unique(x) <color:green>x</color>
!define not_null(x) <u>x</u>

hide methods
hide stereotypes
`;

  constructor() {}

  add(model: Model) {
    const fields = model.properties
      .map((property) => `* ${property.name} (${property.type})`)
      .join('\n');
    this.source += `

entity "${model.name}" as ${model.name} {
${fields}
}
    `;
  }

  relation(model: Model) {
    if (!model.relations.length) {
      return;
    }

    model.relations.forEach((relation) => {
      switch (relation.type) {
        case 'belongsTo':
        case 'belongsToMany':
        case 'hasMany':
        case 'hasOne':
          const line = '||--o{';

          this.source += `
${relation.target} ${line} ${model.name}`;
          break;

        case 'hasManyThrough':
        case 'morphMany':
        case 'morphOne':
          this.source += `
${relation.through} ||--o{ ${relation.target}
${model.name} ||--o{ ${relation.through}`;
      }
    });
  }

  render() {
    return `@startuml
${this.header}

${this.source}
@enduml
`;
  }
}
